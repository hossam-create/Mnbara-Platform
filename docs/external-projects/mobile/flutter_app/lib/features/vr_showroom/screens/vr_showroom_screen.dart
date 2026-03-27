// VR Showroom Screen - شاشة صالة العرض الافتراضية
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';

class VRShowroomScreen extends ConsumerStatefulWidget {
  const VRShowroomScreen({super.key});

  @override
  ConsumerState<VRShowroomScreen> createState() => _VRShowroomScreenState();
}

class _VRShowroomScreenState extends ConsumerState<VRShowroomScreen> {
  final List<VRShowroom> _showrooms = [
    VRShowroom('1', 'معرض الإلكترونيات', '🖥️', 'electronics', 'استكشف أحدث الأجهزة الإلكترونية في بيئة ثلاثية الأبعاد', 156, true),
    VRShowroom('2', 'صالة الأزياء', '👗', 'fashion', 'جرب الملابس افتراضياً قبل الشراء', 89, true),
    VRShowroom('3', 'معرض السيارات', '🚗', 'automotive', 'استكشف السيارات من الداخل والخارج', 234, false),
    VRShowroom('4', 'معرض الأثاث', '🛋️', 'furniture', 'شاهد الأثاث في غرفتك الافتراضية', 67, true),
    VRShowroom('5', 'معرض المجوهرات', '💎', 'jewelry', 'تفاصيل دقيقة للمجوهرات بتقنية VR', 45, true),
  ];

  final List<VREvent> _events = [
    VREvent('1', 'إطلاق iPhone 16', '📱', DateTime.now().add(const Duration(days: 2)), 1250),
    VREvent('2', 'عرض أزياء الشتاء', '👠', DateTime.now().add(const Duration(days: 5)), 890),
    VREvent('3', 'معرض السيارات الكهربائية', '⚡', DateTime.now().add(const Duration(days: 10)), 2100),
  ];

  bool _isVRMode = false;
  String? _activeShowroomId;

  @override
  Widget build(BuildContext context) {
    if (_isVRMode && _activeShowroomId != null) {
      return _buildVRView();
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('صالات العرض الافتراضية'),
        actions: [
          IconButton(icon: const Icon(Icons.person), onPressed: _showAvatarCustomization),
          IconButton(icon: const Icon(Icons.help_outline), onPressed: _showVRHelp),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // VR Banner
            _buildVRBanner(),
            // Featured Showrooms
            _buildSectionTitle('صالات العرض المتاحة'),
            _buildShowroomsList(),
            // Upcoming Events
            _buildSectionTitle('فعاليات قادمة'),
            _buildEventsList(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildVRBanner() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primary.withOpacity(0.7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.vrpano, size: 48, color: Colors.white),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('تجربة تسوق افتراضية', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text('استكشف المنتجات في بيئة ثلاثية الأبعاد', style: TextStyle(color: Colors.white70)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildStatChip('🏪 ${_showrooms.length}', 'صالة'),
              const SizedBox(width: 12),
              _buildStatChip('👥 ${_showrooms.fold(0, (sum, s) => sum + s.visitors)}', 'زائر'),
              const SizedBox(width: 12),
              _buildStatChip('📅 ${_events.length}', 'فعالية'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatChip(String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text('$value $label', style: const TextStyle(color: Colors.white, fontSize: 12)),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildShowroomsList() {
    return SizedBox(
      height: 220,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _showrooms.length,
        itemBuilder: (context, index) => _buildShowroomCard(_showrooms[index]),
      ),
    );
  }

  Widget _buildShowroomCard(VRShowroom showroom) {
    return GestureDetector(
      onTap: () => _enterShowroom(showroom),
      child: Container(
        width: 160,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Center(child: Text(showroom.icon, style: const TextStyle(fontSize: 48))),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(showroom.name, style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(showroom.description, style: TextStyle(fontSize: 11, color: Colors.grey[600]), maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.people, size: 14, color: Colors.grey[500]),
                      const SizedBox(width: 4),
                      Text('${showroom.visitors}', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                      const Spacer(),
                      if (showroom.isLive) Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(8)),
                        child: const Text('مباشر', style: TextStyle(color: Colors.white, fontSize: 10)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEventsList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _events.length,
      itemBuilder: (context, index) => _buildEventCard(_events[index]),
    );
  }

  Widget _buildEventCard(VREvent event) {
    final daysLeft = event.date.difference(DateTime.now()).inDays;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          width: 50, height: 50,
          decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
          child: Center(child: Text(event.icon, style: const TextStyle(fontSize: 24))),
        ),
        title: Text(event.name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('بعد $daysLeft أيام • ${event.registered} مسجل'),
        trailing: ElevatedButton(
          onPressed: () => _registerForEvent(event),
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
          child: const Text('سجل', style: TextStyle(color: Colors.white)),
        ),
      ),
    );
  }

  Widget _buildVRView() {
    final showroom = _showrooms.firstWhere((s) => s.id == _activeShowroomId);
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // VR Environment Placeholder
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(showroom.icon, style: const TextStyle(fontSize: 80)),
                const SizedBox(height: 24),
                Text(showroom.name, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('وضع العرض الافتراضي', style: TextStyle(color: Colors.white70)),
                const SizedBox(height: 32),
                const CircularProgressIndicator(color: Colors.white),
                const SizedBox(height: 16),
                const Text('جاري تحميل البيئة الافتراضية...', style: TextStyle(color: Colors.white54)),
              ],
            ),
          ),
          // Exit Button
          Positioned(
            top: 50, right: 20,
            child: IconButton(
              onPressed: () => setState(() { _isVRMode = false; _activeShowroomId = null; }),
              icon: const Icon(Icons.close, color: Colors.white, size: 32),
            ),
          ),
          // VR Controls
          Positioned(
            bottom: 40, left: 0, right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildVRControl(Icons.rotate_left, 'تدوير'),
                const SizedBox(width: 16),
                _buildVRControl(Icons.zoom_in, 'تكبير'),
                const SizedBox(width: 16),
                _buildVRControl(Icons.shopping_cart, 'شراء'),
                const SizedBox(width: 16),
                _buildVRControl(Icons.share, 'مشاركة'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVRControl(IconData icon, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
          child: Icon(icon, color: Colors.white),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(color: Colors.white, fontSize: 12)),
      ],
    );
  }

  void _enterShowroom(VRShowroom showroom) {
    setState(() { _isVRMode = true; _activeShowroomId = showroom.id; });
  }

  void _showAvatarCustomization() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('تخصيص الأفاتار', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            const CircleAvatar(radius: 50, child: Icon(Icons.person, size: 50)),
            const SizedBox(height: 24),
            ListTile(leading: const Icon(Icons.face), title: const Text('الوجه'), trailing: const Icon(Icons.chevron_right), onTap: () {}),
            ListTile(leading: const Icon(Icons.checkroom), title: const Text('الملابس'), trailing: const Icon(Icons.chevron_right), onTap: () {}),
            ListTile(leading: const Icon(Icons.color_lens), title: const Text('الألوان'), trailing: const Icon(Icons.chevron_right), onTap: () {}),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showVRHelp() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('كيفية استخدام VR'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('🎮 استخدم الأسهم للتنقل'),
            SizedBox(height: 8),
            Text('👆 اضغط على المنتج لمشاهدة التفاصيل'),
            SizedBox(height: 8),
            Text('🔄 اسحب للتدوير حول المنتج'),
            SizedBox(height: 8),
            Text('🛒 اضغط على زر الشراء للإضافة للسلة'),
          ],
        ),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('فهمت'))],
      ),
    );
  }

  void _registerForEvent(VREvent event) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('تم التسجيل في ${event.name} ✓'), backgroundColor: Colors.green));
  }
}

class VRShowroom {
  final String id, name, icon, category, description;
  final int visitors;
  final bool isLive;
  VRShowroom(this.id, this.name, this.icon, this.category, this.description, this.visitors, this.isLive);
}

class VREvent {
  final String id, name, icon;
  final DateTime date;
  final int registered;
  VREvent(this.id, this.name, this.icon, this.date, this.registered);
}
