import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import i18n from '../../i18n';

interface ReportGeneratorProps {
  onGenerate: () => void;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  period: string;
  icon: string;
  color: string;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onGenerate }) => {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'weekly_summary',
      name: 'Weekly Summary',
      description: 'Comprehensive overview of your weekly health metrics and progress',
      type: 'summary',
      period: '7 days',
      icon: 'calendar-outline',
      color: '#3B82F6'
    },
    {
      id: 'monthly_progress',
      name: 'Monthly Progress',
      description: 'Detailed analysis of your monthly health trends and achievements',
      type: 'progress',
      period: '30 days',
      icon: 'trending-up-outline',
      color: '#10B981'
    },
    {
      id: 'quarterly_review',
      name: 'Quarterly Review',
      description: 'In-depth quarterly health assessment and goal evaluation',
      type: 'review',
      period: '90 days',
      icon: 'analytics-outline',
      color: '#8B5CF6'
    },
    {
      id: 'annual_journey',
      name: 'Annual Journey',
      description: 'Complete year-long health journey and milestone celebration',
      type: 'journey',
      period: '365 days',
      icon: 'star-outline',
      color: '#F59E0B'
    }
  ];

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowModal(false);
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;

    try {
      setIsGenerating(true);
      await onGenerate();
      Alert.alert(
        'Report Generated',
        `${selectedTemplate.name} report has been generated successfully!`,
        [{ text: 'OK', style: 'default' }]
      );
      setSelectedTemplate(null);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to generate report. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportIcon = (iconName: string) => {
    switch (iconName) {
      case 'calendar-outline':
        return 'calendar-outline';
      case 'trending-up-outline':
        return 'trending-up-outline';
      case 'analytics-outline':
        return 'analytics-outline';
      case 'star-outline':
        return 'star-outline';
      default:
        return 'document-text-outline';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('premium.generateReport')}
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {selectedTemplate && (
        <View style={[styles.selectedTemplate, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.templateIcon, { backgroundColor: `${selectedTemplate.color}20` }]}>
            <Ionicons 
              name={getReportIcon(selectedTemplate.icon) as any} 
              size={24} 
              color={selectedTemplate.color} 
            />
          </View>
          <View style={styles.templateInfo}>
            <Text style={[styles.templateName, { color: colors.text }]}>
              {selectedTemplate.name}
            </Text>
            <Text style={[styles.templateDescription, { color: colors.gray }]}>
              {selectedTemplate.description}
            </Text>
            <Text style={[styles.templatePeriod, { color: selectedTemplate.color }]}>
              {selectedTemplate.period}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: colors.primary }]}
            onPress={handleGenerateReport}
            disabled={isGenerating}
          >
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Report Template
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.templatesList}>
              {reportTemplates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[styles.templateCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View style={[styles.templateCardIcon, { backgroundColor: `${template.color}20` }]}>
                    <Ionicons 
                      name={getReportIcon(template.icon) as any} 
                      size={20} 
                      color={template.color} 
                    />
                  </View>
                  <View style={styles.templateCardContent}>
                    <Text style={[styles.templateCardName, { color: colors.text }]}>
                      {template.name}
                    </Text>
                    <Text style={[styles.templateCardDescription, { color: colors.gray }]}>
                      {template.description}
                    </Text>
                    <View style={styles.templateCardMeta}>
                      <Text style={[styles.templateCardPeriod, { color: template.color }]}>
                        {template.period}
                      </Text>
                      <Text style={[styles.templateCardType, { color: colors.gray }]}>
                        {template.type}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={20} color={colors.gray} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTemplate: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  templateDescription: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  templatePeriod: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  generateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templatesList: {
    padding: 16,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  templateCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateCardContent: {
    flex: 1,
  },
  templateCardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  templateCardDescription: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  templateCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateCardPeriod: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  templateCardType: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});