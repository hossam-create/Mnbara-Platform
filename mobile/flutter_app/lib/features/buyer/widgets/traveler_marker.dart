import 'dart:ui' as ui;
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

/// Custom marker generator for tracking map
class TrackingMarkers {
  static BitmapDescriptor? _travelerMarker;
  static BitmapDescriptor? _originMarker;
  static BitmapDescriptor? _destinationMarker;

  /// Initialize all custom markers
  static Future<void> initialize() async {
    _travelerMarker = await _createTravelerMarker();
    _originMarker = await _createCircleMarker(Colors.blue, '📍');
    _destinationMarker = await _createCircleMarker(Colors.green, '🏠');
  }

  static BitmapDescriptor get travelerMarker =>
      _travelerMarker ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure);

  static BitmapDescriptor get originMarker =>
      _originMarker ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue);

  static BitmapDescriptor get destinationMarker =>
      _destinationMarker ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen);

  static Future<BitmapDescriptor> _createTravelerMarker() async {
    final pictureRecorder = ui.PictureRecorder();
    final canvas = Canvas(pictureRecorder);
    const size = Size(80, 80);

    // Draw car icon background
    final bgPaint = Paint()
      ..color = const Color(0xFF2563EB)
      ..style = PaintingStyle.fill;

    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2),
      size.width / 2 - 4,
      bgPaint,
    );

    // Draw white border
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;

    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2),
      size.width / 2 - 4,
      borderPaint,
    );

    // Draw car emoji
    final textPainter = TextPainter(
      text: const TextSpan(
        text: '🚗',
        style: TextStyle(fontSize: 36),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(
        (size.width - textPainter.width) / 2,
        (size.height - textPainter.height) / 2,
      ),
    );

    final picture = pictureRecorder.endRecording();
    final image = await picture.toImage(size.width.toInt(), size.height.toInt());
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);

    return BitmapDescriptor.bytes(byteData!.buffer.asUint8List());
  }

  static Future<BitmapDescriptor> _createCircleMarker(Color color, String emoji) async {
    final pictureRecorder = ui.PictureRecorder();
    final canvas = Canvas(pictureRecorder);
    const size = Size(60, 60);

    // Draw background circle
    final bgPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2),
      size.width / 2 - 2,
      bgPaint,
    );

    // Draw white border
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2),
      size.width / 2 - 2,
      borderPaint,
    );

    // Draw emoji
    final textPainter = TextPainter(
      text: TextSpan(
        text: emoji,
        style: const TextStyle(fontSize: 28),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(
        (size.width - textPainter.width) / 2,
        (size.height - textPainter.height) / 2,
      ),
    );

    final picture = pictureRecorder.endRecording();
    final image = await picture.toImage(size.width.toInt(), size.height.toInt());
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);

    return BitmapDescriptor.bytes(byteData!.buffer.asUint8List());
  }

  /// Create a rotated traveler marker based on heading
  static Future<BitmapDescriptor> createRotatedTravelerMarker(double heading) async {
    final pictureRecorder = ui.PictureRecorder();
    final canvas = Canvas(pictureRecorder);
    const size = Size(80, 80);

    // Rotate canvas
    canvas.translate(size.width / 2, size.height / 2);
    canvas.rotate(heading * 3.14159 / 180);
    canvas.translate(-size.width / 2, -size.height / 2);

    // Draw car icon background
    final bgPaint = Paint()
      ..color = const Color(0xFF2563EB)
      ..style = PaintingStyle.fill;

    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2),
      size.width / 2 - 4,
      bgPaint,
    );

    // Draw direction indicator (arrow)
    final arrowPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(size.width / 2, 8)
      ..lineTo(size.width / 2 - 10, 24)
      ..lineTo(size.width / 2 + 10, 24)
      ..close();

    canvas.drawPath(path, arrowPaint);

    // Draw car emoji
    final textPainter = TextPainter(
      text: const TextSpan(
        text: '🚗',
        style: TextStyle(fontSize: 32),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(
        (size.width - textPainter.width) / 2,
        (size.height - textPainter.height) / 2 + 4,
      ),
    );

    final picture = pictureRecorder.endRecording();
    final image = await picture.toImage(size.width.toInt(), size.height.toInt());
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);

    return BitmapDescriptor.bytes(byteData!.buffer.asUint8List());
  }
}

/// Widget to show traveler info window on map
class TravelerInfoWindow extends StatelessWidget {
  final String name;
  final String? eta;
  final String? distance;

  const TravelerInfoWindow({
    super.key,
    required this.name,
    this.eta,
    this.distance,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            name,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          if (eta != null || distance != null) ...[
            const SizedBox(height: 4),
            Text(
              [if (eta != null) eta, if (distance != null) distance].join(' • '),
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
