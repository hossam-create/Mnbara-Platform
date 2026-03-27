import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/location_tracking_provider.dart';
import '../models/traveler_location_model.dart';
import '../widgets/tracking_bottom_sheet.dart';
import '../widgets/traveler_marker.dart';

class LiveTrackingScreen extends ConsumerStatefulWidget {
  final String deliveryId;

  const LiveTrackingScreen({super.key, required this.deliveryId});

  @override
  ConsumerState<LiveTrackingScreen> createState() => _LiveTrackingScreenState();
}

class _LiveTrackingScreenState extends ConsumerState<LiveTrackingScreen> {
  GoogleMapController? _mapController;
  bool _markersInitialized = false;
  BitmapDescriptor? _travelerMarker;
  BitmapDescriptor? _originMarker;
  BitmapDescriptor? _destinationMarker;

  @override
  void initState() {
    super.initState();
    _initializeMarkers();
    Future.microtask(() {
      ref.read(locationTrackingProvider.notifier).startTracking(widget.deliveryId);
    });
  }

  Future<void> _initializeMarkers() async {
    await TrackingMarkers.initialize();
    if (mounted) {
      setState(() {
        _travelerMarker = TrackingMarkers.travelerMarker;
        _originMarker = TrackingMarkers.originMarker;
        _destinationMarker = TrackingMarkers.destinationMarker;
        _markersInitialized = true;
      });
    }
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final state = ref.watch(locationTrackingProvider);

    return Scaffold(
      body: Stack(
        children: [
          // Google Map
          _buildMap(state),
          
          // App Bar
          _buildAppBar(l10n, state),
          
          // Connection Status Banner
          if (!state.isConnected && state.currentLocation != null)
            _buildConnectionBanner(l10n, state),
          
          // Bottom Sheet
          if (state.currentLocation != null)
            TrackingBottomSheet(
              location: state.currentLocation!,
              connectionStatus: state.connectionStatus,
              lastUpdate: state.lastUpdate,
              onRefresh: () => ref.read(locationTrackingProvider.notifier).refreshLocation(),
            ),
          
          // Loading Overlay
          if (state.isLoading && state.currentLocation == null)
            _buildLoadingOverlay(l10n),
          
          // Error State
          if (state.hasError && state.currentLocation == null)
            _buildErrorState(l10n, state),
          
          // FAB for centering
          if (state.currentLocation != null)
            Positioned(
              right: 16,
              bottom: MediaQuery.of(context).size.height * 0.38,
              child: _buildCenterFab(state),
            ),
        ],
      ),
    );
  }

  Widget _buildMap(LocationTrackingState state) {
    final location = state.currentLocation;
    
    // Default to Riyadh if no location
    final initialPosition = location?.currentLatLng ?? const LatLng(24.7136, 46.6753);

    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: initialPosition,
        zoom: 14,
      ),
      onMapCreated: (controller) {
        _mapController = controller;
        if (location != null) {
          _fitBounds();
        }
      },
      markers: _buildMarkers(state),
      polylines: _buildPolylines(state),
      myLocationEnabled: false,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      mapToolbarEnabled: false,
      compassEnabled: true,
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).size.height * 0.35,
        top: 100,
      ),
    );
  }

  Set<Marker> _buildMarkers(LocationTrackingState state) {
    final markers = <Marker>{};
    final location = state.currentLocation;
    
    if (location == null || !_markersInitialized) return markers;

    // Traveler marker
    markers.add(Marker(
      markerId: const MarkerId('traveler'),
      position: location.currentLatLng,
      icon: _travelerMarker ?? BitmapDescriptor.defaultMarker,
      anchor: const Offset(0.5, 0.5),
      rotation: location.heading ?? 0,
      infoWindow: InfoWindow(
        title: location.travelerName,
        snippet: location.eta != null 
            ? '${location.eta!.inMinutes} min' 
            : null,
      ),
    ));

    // Origin marker
    markers.add(Marker(
      markerId: const MarkerId('origin'),
      position: location.origin,
      icon: _originMarker ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
      infoWindow: InfoWindow(title: location.originAddress),
    ));

    // Destination marker
    markers.add(Marker(
      markerId: const MarkerId('destination'),
      position: location.destination,
      icon: _destinationMarker ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
      infoWindow: InfoWindow(title: location.destinationAddress),
    ));

    return markers;
  }

  Set<Polyline> _buildPolylines(LocationTrackingState state) {
    final polylines = <Polyline>{};
    final location = state.currentLocation;
    
    if (location == null) return polylines;

    // Route from traveler to destination
    polylines.add(Polyline(
      polylineId: const PolylineId('route'),
      points: [location.currentLatLng, location.destination],
      color: AppColors.primary,
      width: 4,
      patterns: [PatternItem.dash(20), PatternItem.gap(10)],
    ));

    // Traveled path (if available)
    if (state.routePoints.length > 1) {
      polylines.add(Polyline(
        polylineId: const PolylineId('traveled'),
        points: state.routePoints,
        color: AppColors.success,
        width: 3,
      ));
    }

    return polylines;
  }

  Widget _buildAppBar(AppLocalizations l10n, LocationTrackingState state) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.only(
          top: MediaQuery.of(context).padding.top + 8,
          left: 8,
          right: 8,
          bottom: 8,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.white,
              Colors.white.withOpacity(0.9),
              Colors.white.withOpacity(0),
            ],
          ),
        ),
        child: Row(
          children: [
            IconButton(
              onPressed: () => context.pop(),
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: const Icon(Icons.arrow_back, size: 20),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: state.isConnected ? AppColors.success : Colors.orange,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      l10n.translate('live_tracking'),
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: () => ref.read(locationTrackingProvider.notifier).refreshLocation(),
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: const Icon(Icons.refresh, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConnectionBanner(AppLocalizations l10n, LocationTrackingState state) {
    if (state.connectionStatus == ConnectionStatus.connected) {
      return const SizedBox.shrink();
    }

    return Positioned(
      top: MediaQuery.of(context).padding.top + 70,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: state.connectionStatus == ConnectionStatus.reconnecting
              ? Colors.orange
              : Colors.red,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(
              state.connectionStatus == ConnectionStatus.reconnecting
                  ? Icons.sync
                  : Icons.cloud_off,
              color: Colors.white,
              size: 18,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                state.connectionStatus == ConnectionStatus.reconnecting
                    ? l10n.translate('reconnecting')
                    : l10n.translate('connection_lost'),
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
            if (state.lastUpdate != null)
              Text(
                l10n.translate('last_update_ago').replaceAll(
                  '{time}',
                  _formatTimeDiff(state.lastUpdate!),
                ),
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
          ],
        ),
      ),
    );
  }

  String _formatTimeDiff(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    return '${diff.inHours}h';
  }

  Widget _buildCenterFab(LocationTrackingState state) {
    return FloatingActionButton.small(
      onPressed: () => _centerOnTraveler(state),
      backgroundColor: Colors.white,
      child: const Icon(Icons.my_location, color: AppColors.primary),
    );
  }

  void _centerOnTraveler(LocationTrackingState state) {
    final location = state.currentLocation;
    if (location != null && _mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(location.currentLatLng, 16),
      );
    }
  }

  void _fitBounds() {
    final bounds = ref.read(locationTrackingProvider.notifier).getBounds();
    if (bounds != null && _mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newLatLngBounds(bounds, 60),
      );
    }
  }

  Widget _buildLoadingOverlay(AppLocalizations l10n) {
    return Container(
      color: Colors.white,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: AppColors.primary),
            const SizedBox(height: 16),
            Text(
              l10n.translate('loading_tracking'),
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(AppLocalizations l10n, LocationTrackingState state) {
    return Container(
      color: Colors.white,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.location_off,
                size: 64,
                color: AppColors.textSecondary,
              ),
              const SizedBox(height: 16),
              Text(
                l10n.translate('tracking_unavailable'),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                l10n.translate('tracking_unavailable_desc'),
                style: const TextStyle(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  ref.read(locationTrackingProvider.notifier).startTracking(widget.deliveryId);
                },
                icon: const Icon(Icons.refresh),
                label: Text(l10n.translate('retry')),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.pop(),
                child: Text(l10n.translate('go_back')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
