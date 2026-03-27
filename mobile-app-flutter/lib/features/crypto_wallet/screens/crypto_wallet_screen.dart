// Crypto Wallet Screen - شاشة محفظة العملات الرقمية
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/crypto_service.dart';
import '../../../core/theme/app_colors.dart';

class CryptoWalletScreen extends ConsumerStatefulWidget {
  const CryptoWalletScreen({super.key});

  @override
  ConsumerState<CryptoWalletScreen> createState() => _CryptoWalletScreenState();
}

class _CryptoWalletScreenState extends ConsumerState<CryptoWalletScreen> {
  final List<CryptoAsset> _assets = [
    CryptoAsset('BTC', 'Bitcoin', 0.0025, 42500, 'assets/crypto/btc.png'),
    CryptoAsset('ETH', 'Ethereum', 0.15, 2250, 'assets/crypto/eth.png'),
    CryptoAsset('USDT', 'Tether', 500, 1, 'assets/crypto/usdt.png'),
    CryptoAsset('USDC', 'USD Coin', 250, 1, 'assets/crypto/usdc.png'),
  ];

  double get _totalBalance {
    return _assets.fold(0, (sum, asset) => sum + (asset.balance * asset.price));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // Header with Balance
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: _buildBalanceHeader(),
            ),
          ),
          // Actions
          SliverToBoxAdapter(child: _buildActions()),
          // Assets List
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: const Text('أصولك', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) => _buildAssetCard(_assets[index]),
              childCount: _assets.length,
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Widget _buildBalanceHeader() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.primary.withOpacity(0.8)],
        ),
      ),
      child: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('إجمالي الرصيد', style: TextStyle(color: Colors.white70, fontSize: 14)),
            const SizedBox(height: 8),
            Text(
              '\$${_totalBalance.toStringAsFixed(2)}',
              style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text('+2.5% اليوم', style: TextStyle(color: Colors.greenAccent)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActions() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildActionButton(Icons.arrow_downward, 'إيداع', Colors.green, () => _showDepositSheet()),
          _buildActionButton(Icons.arrow_upward, 'سحب', Colors.orange, () => _showWithdrawSheet()),
          _buildActionButton(Icons.swap_horiz, 'تحويل', Colors.blue, () => _showExchangeSheet()),
          _buildActionButton(Icons.shopping_cart, 'دفع', AppColors.primary, () => _showPaySheet()),
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildAssetCard(CryptoAsset asset) {
    final value = asset.balance * asset.price;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.grey[200],
          child: Text(asset.symbol[0], style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
        title: Text(asset.name),
        subtitle: Text('${asset.balance} ${asset.symbol}'),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('\$${value.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
            Text('\$${asset.price}', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
          ],
        ),
        onTap: () => _showAssetDetails(asset),
      ),
    );
  }

  void _showDepositSheet() => _showBottomSheet('إيداع', Icons.arrow_downward, Colors.green);
  void _showWithdrawSheet() => _showBottomSheet('سحب', Icons.arrow_upward, Colors.orange);
  void _showExchangeSheet() => _showBottomSheet('تحويل', Icons.swap_horiz, Colors.blue);
  void _showPaySheet() => _showBottomSheet('دفع', Icons.shopping_cart, AppColors.primary);

  void _showBottomSheet(String title, IconData icon, Color color) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 48, color: color),
              const SizedBox(height: 16),
              Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              TextField(
                decoration: InputDecoration(
                  labelText: 'المبلغ',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.attach_money),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: color,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(title, style: const TextStyle(color: Colors.white)),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _showAssetDetails(CryptoAsset asset) {
    Navigator.push(context, MaterialPageRoute(
      builder: (context) => Scaffold(
        appBar: AppBar(title: Text(asset.name)),
        body: Center(child: Text('تفاصيل ${asset.name}')),
      ),
    ));
  }
}

class CryptoAsset {
  final String symbol;
  final String name;
  final double balance;
  final double price;
  final String icon;

  CryptoAsset(this.symbol, this.name, this.balance, this.price, this.icon);
}
