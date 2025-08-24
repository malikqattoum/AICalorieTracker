import { Router } from 'express';
import { storage } from '../../../storage-provider';
import { authenticate } from '../../middleware/auth';
import { languages, insertLanguageSchema } from '@shared/schema';
import { eq, sql, and, not } from 'drizzle-orm';

const router = Router();
// Admin middleware would be applied at the router level in the main app setup

// GET all languages
router.get('/', async (req, res) => {
  try {
    const allLanguages = await storage.db.select().from(languages).orderBy(languages.name);
    res.json(allLanguages);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ message: 'Failed to fetch languages' });
  }
});

// POST create a new language
router.post('/', async (req, res) => {
  try {
    const validatedData = insertLanguageSchema.parse(req.body);

    // If this language is set as default, ensure no other language is default
    if (validatedData.isDefault) {
      await storage.db.update(languages).set({ isDefault: false }).where(not(eq(languages.code, validatedData.code)));
    }

    const newLanguage = await storage.db.insert(languages).values(validatedData).returning();
    res.status(201).json(newLanguage[0]);
  } catch (error) {
    console.error('Error creating language:', error);
    // @ts-ignore
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
      return res.status(409).json({ message: 'Language code already exists.' });
    }
    // @ts-ignore
    if (error.errors) { // Zod validation error
      return res.status(400).json({ message: 'Invalid data', errors: (error as any).errors });
    }
    res.status(500).json({ message: 'Failed to create language' });
  }
});

// GET a single language by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
    const language = await storage.db.select().from(languages).where(eq(languages.id, id));
    if (language.length === 0) {
      return res.status(404).json({ message: 'Language not found' });
    }
    res.json(language[0]);
  } catch (error) {
    console.error('Error fetching language:', error);
    res.status(500).json({ message: 'Failed to fetch language' });
  }
});

// PUT update a language by ID
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    const { code, name, isActive, isDefault } = req.body;
    const updateData: Partial<typeof languages.$inferInsert> = {};

    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    // updateData.updatedAt = new Date(); // Drizzle handles this

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No update data provided' });
    }

    // If this language is being set as default, ensure no other language is default
    if (updateData.isDefault) {
      await storage.db.update(languages).set({ isDefault: false }).where(not(eq(languages.id, id)));
    }
    // If a language is being unset as default, ensure at least one other active language is default
    // This logic might be complex if no other language can be default. For now, we allow unsetting.
    // A more robust solution would be to pick another active language or prevent unsetting if it's the only default.

    const updatedLanguage = await storage.db.update(languages)
      .set(updateData)
      .where(eq(languages.id, id))
      .returning();

    if (updatedLanguage.length === 0) {
      return res.status(404).json({ message: 'Language not found or no changes made' });
    }
    res.json(updatedLanguage[0]);
  } catch (error) {
    console.error('Error updating language:', error);
    // @ts-ignore
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
      return res.status(409).json({ message: 'Language code already exists.' });
    }
    res.status(500).json({ message: 'Failed to update language' });
  }
});

// DELETE a language by ID
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    // Prevent deleting the default language if it's the only active default one.
    const langToDelete = await storage.db.select().from(languages).where(eq(languages.id, id));
    if (langToDelete.length > 0 && langToDelete[0].isDefault) {
        const otherDefaultLanguages = await storage.db.select().from(languages).where(and(eq(languages.isDefault, true), not(eq(languages.id, id)), eq(languages.isActive, true)));
        if(otherDefaultLanguages.length === 0){
            return res.status(400).json({ message: 'Cannot delete the only active default language. Set another language as default first.' });
        }
    }

    const deletedLanguage = await storage.db.delete(languages)
      .where(eq(languages.id, id))
      .returning();

    if (deletedLanguage.length === 0) {
      return res.status(404).json({ message: 'Language not found' });
    }
    // The schema has onDelete: 'cascade' for translations.languageId, so translations will be automatically deleted
    res.status(200).json({ message: 'Language deleted successfully' });
  } catch (error) {
    console.error('Error deleting language:', error);
    res.status(500).json({ message: 'Failed to delete language' });
  }
});

export default router;