import { DataRoomService, DataRoomDocument, DataRoomEvidencePack } from './DataRoomService';

export interface DataRoomPackContent {
  executiveSummary: string;
  financialHighlights: {
    totalDocuments: number;
    totalSizeBytes: number;
    documentTypes: Record<string, number>;
    sensitivityDistribution: Record<string, number>;
  };
  legalHighlights: {
    contractsCount: number;
    corporateDocsCount: number;
    ndaComplianceRate: number;
  };
  operationalHighlights: {
    processesDocumented: number;
    evidenceCompleteness: number;
    verificationStatus: Record<string, number>;
  };
  governanceHighlights: {
    riskRegisterItems: number;
    kpiReportsCount: number;
    complianceScore: number;
  };
  accessControl: {
    totalUsers: number;
    activeUsers: number;
    ndaSignedUsers: number;
    accessByRole: Record<string, number>;
  };
  recommendations: string[];
}

export class DataRoomPackGenerator {
  private dataRoomService: DataRoomService;

  constructor() {
    this.dataRoomService = new DataRoomService();
  }

  // Generate complete data room pack content
  async generatePackContent(
    businessAccountId: string,
    packType: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<DataRoomPackContent> {
    const isArabic = language === 'ar';
    
    // Get all documents
    const documents = await this.dataRoomService.getDocuments(businessAccountId, {
      latestVersionOnly: true,
      limit: 1000
    });
    
    // Get evidence packs
    const evidencePacks = await this.dataRoomService.getEvidencePacks(businessAccountId, {
      limit: 100
    });
    
    // Get access summary
    const accessSummary = await this.dataRoomService.getAccessSummary(businessAccountId);
    
    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(documents, evidencePacks, accessSummary, language);
    
    // Generate highlights
    const financialHighlights = this.generateFinancialHighlights(documents, language);
    const legalHighlights = this.generateLegalHighlights(documents, language);
    const operationalHighlights = this.generateOperationalHighlights(documents, language);
    const governanceHighlights = this.generateGovernanceHighlights(documents, language);
    const accessControl = this.generateAccessControl(accessSummary, language);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(documents, evidencePacks, accessSummary, language);
    
    return {
      executiveSummary,
      financialHighlights,
      legalHighlights,
      operationalHighlights,
      governanceHighlights,
      accessControl,
      recommendations
    };
  }

  // Generate executive summary
  private generateExecutiveSummary(
    documents: DataRoomDocument[],
    evidencePacks: DataRoomEvidencePack[],
    accessSummary: any[],
    language: 'en' | 'ar'
  ): string {
    const isArabic = language === 'ar';
    const totalDocuments = documents.length;
    const verifiedDocuments = documents.filter(d => d.verificationStatus === 'verified').length;
    const verificationRate = totalDocuments > 0 ? (verifiedDocuments / totalDocuments) * 100 : 0;
    
    if (isArabic) {
      return `
ملخص تنفيذي لغرفة البيانات

المستندات الإجمالية: ${totalDocuments} مستند
المستندات الموثقة: ${verifiedDocuments} مستند (${verificationRate.toFixed(1)}%)
حزم الأدلة: ${evidencePacks.length} حزمة
المستخدمون النشطون: ${accessSummary.reduce((sum, item) => sum + (item.activeUsers || 0), 0)} مستخدم
معدل الامتثال لـ NDA: ${this.calculateNdaComplianceRate(accessSummary)}%

التقييم العام: ${verificationRate >= 90 ? 'ممتاز' : verificationRate >= 70 ? 'جيد' : 'يحتاج تحسين'}
الحالة: ${verificationRate >= 90 ? 'جاهز للتدقيق' : 'يحتاج مزيد من العمل'}
      `.trim();
    } else {
      return `
Data Room Executive Summary

Total Documents: ${totalDocuments} documents
Verified Documents: ${verifiedDocuments} documents (${verificationRate.toFixed(1)}%)
Evidence Packs: ${evidencePacks.length} packs
Active Users: ${accessSummary.reduce((sum, item) => sum + (item.activeUsers || 0), 0)} users
NDA Compliance Rate: ${this.calculateNdaComplianceRate(accessSummary)}%

Overall Rating: ${verificationRate >= 90 ? 'Excellent' : verificationRate >= 70 ? 'Good' : 'Needs Improvement'}
Status: ${verificationRate >= 90 ? 'Due Diligence Ready' : 'Requires Additional Work'}
      `.trim();
    }
  }

  // Generate financial highlights
  private generateFinancialHighlights(documents: DataRoomDocument[], language: 'en' | 'ar'): DataRoomPackContent['financialHighlights'] {
    const isArabic = language === 'ar';
    
    // Count by document type
    const documentTypes = documents.reduce((acc, doc) => {
      acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count by sensitivity level
    const sensitivityDistribution = documents.reduce((acc, doc) => {
      acc[doc.sensitivityLevel] = (acc[doc.sensitivityLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate total size
    const totalSizeBytes = documents.reduce((sum, doc) => sum + doc.fileSizeBytes, 0);
    
    return {
      totalDocuments: documents.length,
      totalSizeBytes,
      documentTypes,
      sensitivityDistribution
    };
  }

  // Generate legal highlights
  private generateLegalHighlights(documents: DataRoomDocument[], language: 'en' | 'ar'): DataRoomPackContent['legalHighlights'] {
    const isArabic = language === 'ar';
    
    const contractsCount = documents.filter(d => d.documentType === 'contract').length;
    const corporateDocsCount = documents.filter(d => d.documentType === 'corporate_doc').length;
    const ndaRequiredCount = documents.filter(d => d.requiresNda).length;
    const ndaComplianceRate = documents.length > 0 ? (ndaRequiredCount / documents.length) * 100 : 0;
    
    return {
      contractsCount,
      corporateDocsCount,
      ndaComplianceRate
    };
  }

  // Generate operational highlights
  private generateOperationalHighlights(documents: DataRoomDocument[], language: 'en' | 'ar'): DataRoomPackContent['operationalHighlights'] {
    const isArabic = language === 'ar';
    
    const processesDocumented = documents.filter(d => 
      ['fpna_model', 'kpi_report', 'risk_register'].includes(d.documentType)
    ).length;
    
    const evidenceCompleteness = documents.filter(d => d.documentType === 'evidence').length;
    
    const verificationStatus = documents.reduce((acc, doc) => {
      acc[doc.verificationStatus] = (acc[doc.verificationStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      processesDocumented,
      evidenceCompleteness,
      verificationStatus
    };
  }

  // Generate governance highlights
  private generateGovernanceHighlights(documents: DataRoomDocument[], language: 'en' | 'ar'): DataRoomPackContent['governanceHighlights'] {
    const isArabic = language === 'ar';
    
    const riskRegisterItems = documents.filter(d => d.documentType === 'risk_register').length;
    const kpiReportsCount = documents.filter(d => d.documentType === 'kpi_report').length;
    const complianceScore = this.calculateComplianceScore(documents);
    
    return {
      riskRegisterItems,
      kpiReportsCount,
      complianceScore
    };
  }

  // Generate access control summary
  private generateAccessControl(accessSummary: any[], language: 'en' | 'ar'): DataRoomPackContent['accessControl'] {
    const isArabic = language === 'ar';
    
    const totalUsers = accessSummary.reduce((sum, item) => sum + (item.userCount || 0), 0);
    const activeUsers = accessSummary.reduce((sum, item) => sum + (item.activeUsers || 0), 0);
    const ndaSignedUsers = accessSummary.reduce((sum, item) => sum + (item.ndaSigned || 0), 0);
    
    const accessByRole = accessSummary.reduce((acc, item) => {
      acc[item.accessRole] = (acc[item.accessRole] || 0) + (item.userCount || 0);
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalUsers,
      activeUsers,
      ndaSignedUsers,
      accessByRole
    };
  }

  // Generate recommendations
  private generateRecommendations(
    documents: DataRoomDocument[],
    evidencePacks: DataRoomEvidencePack[],
    accessSummary: any[],
    language: 'en' | 'ar'
  ): string[] {
    const isArabic = language === 'ar';
    const recommendations: string[] = [];
    
    const verificationRate = documents.length > 0 ? 
      (documents.filter(d => d.verificationStatus === 'verified').length / documents.length) * 100 : 0;
    
    const ndaComplianceRate = this.calculateNdaComplianceRate(accessSummary);
    
    if (verificationRate < 90) {
      recommendations.push(isArabic ? 
        'تحسين عملية التحقق من المستندات لزيادة معدل التحقق إلى 90%+' :
        'Improve document verification process to achieve 90%+ verification rate'
      );
    }
    
    if (ndaComplianceRate < 100) {
      recommendations.push(isArabic ? 
        'ضمان توقيع جميع اتفاقيات عدم الإفصاح للمستخدمين المصرح لهم' :
        'Ensure all authorized users have signed NDAs'
      );
    }
    
    const hasFinancialStatements = documents.some(d => d.documentType === 'financial_statement');
    if (!hasFinancialStatements) {
      recommendations.push(isArabic ? 
        'إضافة البيانات المالية الحديثة (قوائم الدخل والميزانيات العمومية)' :
        'Add recent financial statements (income statements and balance sheets)'
      );
    }
    
    const hasRiskRegister = documents.some(d => d.documentType === 'risk_register');
    if (!hasRiskRegister) {
      recommendations.push(isArabic ? 
        'إنشاء سجل المخاطر وتوثيق استراتيجيات التخفيف' :
        'Create risk register and document mitigation strategies'
      );
    }
    
    const hasContracts = documents.some(d => d.documentType === 'contract');
    if (!hasContracts) {
      recommendations.push(isArabic ? 
        'تضمين العقود الرئيسية والاتفاقيات الهامة' :
        'Include key contracts and agreements'
      );
    }
    
    return recommendations;
  }

  // Helper methods
  private calculateNdaComplianceRate(accessSummary: any[]): number {
    const totalUsers = accessSummary.reduce((sum, item) => sum + (item.userCount || 0), 0);
    const ndaSignedUsers = accessSummary.reduce((sum, item) => sum + (item.ndaSigned || 0), 0);
    return totalUsers > 0 ? (ndaSignedUsers / totalUsers) * 100 : 0;
  }

  private calculateComplianceScore(documents: DataRoomDocument[]): number {
    if (documents.length === 0) return 0;
    
    let score = 0;
    
    // Verification status (40% weight)
    const verifiedCount = documents.filter(d => d.verificationStatus === 'verified').length;
    const verificationScore = (verifiedCount / documents.length) * 40;
    score += verificationScore;
    
    // Document type coverage (30% weight)
    const requiredTypes = ['financial_statement', 'risk_register', 'contract', 'corporate_doc'];
    const coveredTypes = requiredTypes.filter(type => 
      documents.some(doc => doc.documentType === type)
    ).length;
    const coverageScore = (coveredTypes / requiredTypes.length) * 30;
    score += coverageScore;
    
    // NDA compliance (20% weight)
    const ndaRequiredCount = documents.filter(d => d.requiresNda).length;
    const ndaComplianceScore = ndaRequiredCount > 0 ? 
      (documents.filter(d => d.requiresNda && d.verificationStatus === 'verified').length / ndaRequiredCount) * 20 : 20;
    score += ndaComplianceScore;
    
    // Data classification (10% weight)
    const hasProperClassification = documents.every(d => 
      ['public', 'confidential', 'restricted', 'classified'].includes(d.sensitivityLevel)
    );
    const classificationScore = hasProperClassification ? 10 : 0;
    score += classificationScore;
    
    return Math.round(score);
  }
}
