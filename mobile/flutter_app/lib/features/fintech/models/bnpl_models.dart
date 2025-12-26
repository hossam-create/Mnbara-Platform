// BNPL Models - نماذج التقسيط

class BNPLPlan {
  final String id;
  final String name;
  final String nameAr;
  final int installments;
  final double interestRate;
  final double minAmount;
  final double maxAmount;
  final int gracePeriodDays;
  final bool isActive;

  BNPLPlan({
    required this.id,
    required this.name,
    required this.nameAr,
    required this.installments,
    required this.interestRate,
    required this.minAmount,
    required this.maxAmount,
    required this.gracePeriodDays,
    required this.isActive,
  });

  factory BNPLPlan.fromJson(Map<String, dynamic> json) {
    return BNPLPlan(
      id: json['id'],
      name: json['name'],
      nameAr: json['nameAr'],
      installments: json['installments'],
      interestRate: (json['interestRate'] as num).toDouble(),
      minAmount: (json['minAmount'] as num).toDouble(),
      maxAmount: (json['maxAmount'] as num).toDouble(),
      gracePeriodDays: json['gracePeriodDays'],
      isActive: json['isActive'],
    );
  }

  String get displayName => '$installments payments';
  String get displayNameAr => '$installments دفعات';
}

class Installment {
  final String id;
  final String planId;
  final String userId;
  final String orderId;
  final double totalAmount;
  final double paidAmount;
  final double remainingAmount;
  final int totalInstallments;
  final int paidInstallments;
  final String status;
  final DateTime nextPaymentDate;
  final double nextPaymentAmount;
  final DateTime createdAt;

  Installment({
    required this.id,
    required this.planId,
    required this.userId,
    required this.orderId,
    required this.totalAmount,
    required this.paidAmount,
    required this.remainingAmount,
    required this.totalInstallments,
    required this.paidInstallments,
    required this.status,
    required this.nextPaymentDate,
    required this.nextPaymentAmount,
    required this.createdAt,
  });

  factory Installment.fromJson(Map<String, dynamic> json) {
    return Installment(
      id: json['id'],
      planId: json['planId'],
      userId: json['userId'],
      orderId: json['orderId'],
      totalAmount: (json['totalAmount'] as num).toDouble(),
      paidAmount: (json['paidAmount'] as num).toDouble(),
      remainingAmount: (json['remainingAmount'] as num).toDouble(),
      totalInstallments: json['totalInstallments'],
      paidInstallments: json['paidInstallments'],
      status: json['status'],
      nextPaymentDate: DateTime.parse(json['nextPaymentDate']),
      nextPaymentAmount: (json['nextPaymentAmount'] as num).toDouble(),
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  double get progressPercentage => (paidInstallments / totalInstallments) * 100;
  bool get isCompleted => status == 'COMPLETED';
  bool get isOverdue => status == 'OVERDUE';
}

class CreditScore {
  final String userId;
  final int score;
  final String rating;
  final double maxCreditLimit;
  final double availableCredit;
  final DateTime lastUpdated;

  CreditScore({
    required this.userId,
    required this.score,
    required this.rating,
    required this.maxCreditLimit,
    required this.availableCredit,
    required this.lastUpdated,
  });

  factory CreditScore.fromJson(Map<String, dynamic> json) {
    return CreditScore(
      userId: json['userId'],
      score: json['score'],
      rating: json['rating'],
      maxCreditLimit: (json['maxCreditLimit'] as num).toDouble(),
      availableCredit: (json['availableCredit'] as num).toDouble(),
      lastUpdated: DateTime.parse(json['lastUpdated']),
    );
  }

  String get ratingAr {
    switch (rating) {
      case 'EXCELLENT': return 'ممتاز';
      case 'GOOD': return 'جيد';
      case 'FAIR': return 'مقبول';
      case 'POOR': return 'ضعيف';
      default: return rating;
    }
  }

  bool get canApplyForBNPL => score >= 500;
}

class PaymentSchedule {
  final int installmentNumber;
  final double amount;
  final DateTime dueDate;
  final String status;
  final DateTime? paidAt;

  PaymentSchedule({
    required this.installmentNumber,
    required this.amount,
    required this.dueDate,
    required this.status,
    this.paidAt,
  });

  factory PaymentSchedule.fromJson(Map<String, dynamic> json) {
    return PaymentSchedule(
      installmentNumber: json['installmentNumber'],
      amount: (json['amount'] as num).toDouble(),
      dueDate: DateTime.parse(json['dueDate']),
      status: json['status'],
      paidAt: json['paidAt'] != null ? DateTime.parse(json['paidAt']) : null,
    );
  }

  bool get isPaid => status == 'PAID';
  bool get isOverdue => status == 'OVERDUE';
  bool get isPending => status == 'PENDING';
}
