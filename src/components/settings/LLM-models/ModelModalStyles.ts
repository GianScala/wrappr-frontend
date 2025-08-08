// components/styles/ModelModalStyles.ts
import { StyleSheet } from 'react-native';

export const modelModalStyles = (theme: any) => StyleSheet.create({
  modalWrapper: {
    flex: 1,
    paddingTop: 8,
    backgroundColor: theme.colors.background,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
    backgroundColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modalContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalList: {
    backgroundColor: theme.colors.background,
  },
  
  // Section Header Styles
  sectionHeader: {
    backgroundColor: theme.colors.background,
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '40',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.text,
    flex: 1,
  },
  modelCount: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.secondary,
    backgroundColor: theme.colors.border + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  
  // Model Option Styles
  modelOption: {
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modelOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  modelInfo: {
    flex: 1,
  },
  modelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  modelName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-Regular',
    marginRight: 8,
  },
  modelDescription: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.secondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  modelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.secondary,
    letterSpacing: 0.5,
  },
  contextText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.secondary,
  },
  selectionIndicator: {
    marginLeft: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Badge Styles
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  freeBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  proBadge: {
    backgroundColor: theme.colors.warning + '20',
  },
  premiumBadge: {
    backgroundColor: theme.colors.error + '20',
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-Regular',
    letterSpacing: 0.5,
  },
  freeBadgeText: {
    color: theme.colors.success,
  },
  proBadgeText: {
    color: theme.colors.warning,
  },
  premiumBadgeText: {
    color: theme.colors.error,
  },
  newBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 4,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  recommendedBadge: {
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 4,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.warning,
  },
});