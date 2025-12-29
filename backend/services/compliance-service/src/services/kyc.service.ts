import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class KYCService {
  // بدء عملية التحقق من الهوية
  async initiateKYC(userId: string, userData: any) {
    return await prisma.kycVerification.create({
      data: {
        userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        nationality: userData.nationality,
        status: 'pending',
        documents: [],
      },
    });
  }

  // رفع المستندات
  async uploadDocument(kycId: string, documentType: string, documentUrl: string) {
    const kyc = await prisma.kycVerification.findUnique({
      where: { id: kycId },
    });

    if (!kyc) throw new Error('KYC not found');

    const documents = [...(kyc.documents || []), { type: documentType, url: documentUrl }];

    return await prisma.kycVerification.update({
      where: { id: kycId },
      data: { documents },
    });
  }

  // التحقق من المستندات
  async verifyDocuments(kycId: string) {
    const kyc = await prisma.kycVerification.findUnique({
      where: { id: kycId },
    });

    if (!kyc) throw new Error('KYC not found');

    // في الإنتاج، استخدم خدمة التحقق من المستندات
    const isValid = kyc.documents && kyc.documents.length >= 2;

    if (isValid) {
      return await prisma.kycVerification.update({
        where: { id: kycId },
        data: { status: 'verified', verifiedAt: new Date() },
      });
    }

    return kyc;
  }

  // فحص قائمة العقوبات
  async checkSanctionsList(firstName: string, lastName: string, nationality: string) {
    // في الإنتاج، تحقق من قوائم العقوبات الفعلية
    const sanctionedNames = ['test_sanctioned']; // Placeholder

    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const isSanctioned = sanctionedNames.some(name => fullName.includes(name));

    return {
      isSanctioned,
      status: isSanctioned ? 'rejected' : 'approved',
    };
  }

  // التحقق من AML
  async performAMLCheck(userId: string, kycId: string) {
    const kyc = await prisma.kycVerification.findUnique({
      where: { id: kycId },
    });

    if (!kyc) throw new Error('KYC not found');

    // فحص قائمة العقوبات
    const sanctionsCheck = await this.checkSanctionsList(
      kyc.firstName,
      kyc.lastName,
      kyc.nationality
    );

    if (sanctionsCheck.isSanctioned) {
      return await prisma.kycVerification.update({
        where: { id: kycId },
        data: { status: 'rejected', rejectionReason: 'Sanctions list match' },
      });
    }

    // تحديث الحالة
    return await prisma.kycVerification.update({
      where: { id: kycId },
      data: { status: 'approved', amlApprovedAt: new Date() },
    });
  }

  // الحصول على حالة KYC
  async getKYCStatus(userId: string) {
    return await prisma.kycVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // تسجيل معاملة مريبة
  async reportSuspiciousTransaction(userId: string, transactionId: string, reason: string) {
    return await prisma.suspiciousTransaction.create({
      data: {
        userId,
        transactionId,
        reason,
        status: 'reported',
        reportedAt: new Date(),
      },
    });
  }

  // الحصول على المعاملات المريبة
  async getSuspiciousTransactions(limit = 100) {
    return await prisma.suspiciousTransaction.findMany({
      where: { status: 'reported' },
      orderBy: { reportedAt: 'desc' },
      take: limit,
    });
  }
}
