import { Router } from 'express';
import { storage } from '../../../storage-provider';
import { isAdmin } from '../../middleware/auth';
import { translations, insertTranslationSchema, languages } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOpenAIClient } from '../../../openai'; // Assuming openai.ts is in the root server folder

const router = Router();
router.use(isAdmin);

// GET all translations for a specific language ID
router.get('/language/:languageId', async (req, res) => {
  try {
    const languageId = parseInt(req.params.languageId);
    if (isNaN(languageId)) return res.status(400).json({ message: 'Invalid Language ID' });

    const allTranslations = await storage.db.select()
      .from(translations)
      .where(eq(translations.languageId, languageId))
      .orderBy(translations.key);
    res.json(allTranslations);
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ message: 'Failed to fetch translations' });
  }
});

// POST create a new translation
router.post('/', async (req, res) => {
  try {
    const validatedData = insertTranslationSchema.parse(req.body);
    const newTranslation = await storage.db.insert(translations).values(validatedData).returning();
    res.status(201).json(newTranslation[0]);
  } catch (error) {
    console.error('Error creating translation:', error);
    // @ts-ignore
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
      return res.status(409).json({ message: 'Translation key already exists for this language.' });
    }
    // @ts-ignore
    if (error.errors) { // Zod validation error
      return res.status(400).json({ message: 'Invalid data', errors: (error as any).errors });
    }
    res.status(500).json({ message: 'Failed to create translation' });
  }
});

// PUT update a translation by ID
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    const { key, value, isAutoTranslated } = req.body;
    const updateData: Partial<typeof translations.$inferInsert> = {};

    // languageId should not be changed via this route, only key and value
    if (key !== undefined) updateData.key = key;
    if (value !== undefined) updateData.value = value;
    if (isAutoTranslated !== undefined) updateData.isAutoTranslated = isAutoTranslated;
    // updateData.updatedAt = new Date(); // Drizzle handles this

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No update data provided' });
    }

    const updatedTranslation = await storage.db.update(translations)
      .set(updateData)
      .where(eq(translations.id, id))
      .returning();

    if (updatedTranslation.length === 0) {
      return res.status(404).json({ message: 'Translation not found or no changes made' });
    }
    res.json(updatedTranslation[0]);
  } catch (error) {
    console.error('Error updating translation:', error);
    // @ts-ignore
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
      return res.status(409).json({ message: 'Translation key already exists for this language.' });
    }
    res.status(500).json({ message: 'Failed to update translation' });
  }
});

// DELETE a translation by ID
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    const deletedTranslation = await storage.db.delete(translations)
      .where(eq(translations.id, id))
      .returning();

    if (deletedTranslation.length === 0) {
      return res.status(404).json({ message: 'Translation not found' });
    }
    res.status(200).json({ message: 'Translation deleted successfully' });
  } catch (error) {
    console.error('Error deleting translation:', error);
    res.status(500).json({ message: 'Failed to delete translation' });
  }
});

// POST auto-translate a single key or all keys for a language
router.post('/auto-translate', async (req, res) => {
  const { languageId, targetLanguageCode, translationKey, textToTranslate } = req.body;

  if (!languageId || !targetLanguageCode) {
    return res.status(400).json({ message: 'languageId and targetLanguageCode are required.' });
  }
  if (!translationKey && !textToTranslate) {
    // Mode: translate all missing keys for a language (not implemented yet, would be more complex)
    // For now, we require either a specific key (and its English value) or specific text to translate for a new key
    return res.status(400).json({ message: 'Either translationKey (to find English source) or textToTranslate (for a new/direct translation) is required.' });
  }

  try {
    const openai = getOpenAIClient();
    let sourceText = textToTranslate;

    if (translationKey && !textToTranslate) {
      // Find the English version of the key to use as source for translation
      const englishLang = await storage.db.select().from(languages).where(eq(languages.code, 'en')).limit(1);
      if (!englishLang || englishLang.length === 0) {
        return res.status(400).json({ message: 'English (en) language not found as a source for translation.' });
      }
      const sourceTranslation = await storage.db.select().from(translations)
        .where(and(eq(translations.languageId, englishLang[0].id), eq(translations.key, translationKey)))
        .limit(1);
      if (!sourceTranslation || sourceTranslation.length === 0) {
        return res.status(404).json({ message: `Source translation for key '${translationKey}' in English not found.` });
      }
      sourceText = sourceTranslation[0].value;
    }

    if (!sourceText) {
        return res.status(400).json({ message: 'No source text available for translation.' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: `You are a translation assistant. Translate the given text to ${targetLanguageCode}. Output only the translated text, nothing else.` },
        { role: 'user', content: sourceText }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      return res.status(500).json({ message: 'AI translation failed to produce text.' });
    }

    // If a translationKey was provided, update or insert the translation
    if (translationKey) {
        const existingTranslation = await storage.db.select().from(translations)
            .where(and(eq(translations.languageId, languageId), eq(translations.key, translationKey)))
            .limit(1);

        if (existingTranslation.length > 0) {
            await storage.db.update(translations)
                .set({ value: translatedText, isAutoTranslated: true, updatedAt: sql`CURRENT_TIMESTAMP` })
                .where(eq(translations.id, existingTranslation[0].id));
        } else {
            await storage.db.insert(translations).values({
                languageId,
                key: translationKey,
                value: translatedText,
                isAutoTranslated: true
            });
        }
    }

    res.json({ translatedText, sourceText, translationKey });

  } catch (error) {
    console.error('Error during auto-translation:', error);
    res.status(500).json({ message: 'Failed to auto-translate' });
  }
});


export default router;