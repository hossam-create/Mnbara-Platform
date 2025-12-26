// Crypto Service - خدمة العملات الرقمية
import '../../../core/network/api_client.dart';

class CryptoService {
  static const String baseUrl = '/api/v1/crypto';

  // Get wallet
  Future<Map<String, dynamic>> getWallet(String userId) async {
    return await ApiClient.get('$baseUrl/wallets/$userId');
  }

  // Get balances
  Future<List<Map<String, dynamic>>> getBalances(String walletId) async {
    final response = await ApiClient.get('$baseUrl/wallets/$walletId/balances');
    return List<Map<String, dynamic>>.from(response['balances']);
  }

  // Deposit
  Future<Map<String, dynamic>> deposit({
    required String walletId,
    required String currency,
    required double amount,
  }) async {
    return await ApiClient.post('$baseUrl/wallets/$walletId/deposit', {
      'currency': currency,
      'amount': amount,
    });
  }

  // Withdraw
  Future<Map<String, dynamic>> withdraw({
    required String walletId,
    required String currency,
    required double amount,
    required String address,
  }) async {
    return await ApiClient.post('$baseUrl/wallets/$walletId/withdraw', {
      'currency': currency,
      'amount': amount,
      'address': address,
    });
  }

  // Exchange
  Future<Map<String, dynamic>> exchange({
    required String walletId,
    required String fromCurrency,
    required String toCurrency,
    required double amount,
  }) async {
    return await ApiClient.post('$baseUrl/exchange', {
      'walletId': walletId,
      'fromCurrency': fromCurrency,
      'toCurrency': toCurrency,
      'amount': amount,
    });
  }

  // Get exchange rate
  Future<double> getExchangeRate(String from, String to) async {
    final response = await ApiClient.get('$baseUrl/rates/$from/$to');
    return response['rate'];
  }

  // Get transactions
  Future<List<Map<String, dynamic>>> getTransactions(String walletId) async {
    final response = await ApiClient.get('$baseUrl/wallets/$walletId/transactions');
    return List<Map<String, dynamic>>.from(response['transactions']);
  }
}
