import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:equatable/equatable.dart';

final addressProvider = StateNotifierProvider<AddressNotifier, List<Address>>((ref) {
  return AddressNotifier();
});

class Address extends Equatable {
  final String id;
  final String label;
  final String street;
  final String city;
  final String state;
  final String zipCode;
  final String phone;
  final bool isDefault;

  const Address({
    required this.id,
    required this.label,
    required this.street,
    required this.city,
    required this.state,
    required this.zipCode,
    required this.phone,
    this.isDefault = false,
  });

  String get fullAddress => '$street, $city, $state $zipCode';

  Address copyWith({
    String? id,
    String? label,
    String? street,
    String? city,
    String? state,
    String? zipCode,
    String? phone,
    bool? isDefault,
  }) {
    return Address(
      id: id ?? this.id,
      label: label ?? this.label,
      street: street ?? this.street,
      city: city ?? this.city,
      state: state ?? this.state,
      zipCode: zipCode ?? this.zipCode,
      phone: phone ?? this.phone,
      isDefault: isDefault ?? this.isDefault,
    );
  }

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id'],
      label: json['label'],
      street: json['street'],
      city: json['city'],
      state: json['state'],
      zipCode: json['zipCode'],
      phone: json['phone'],
      isDefault: json['isDefault'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'street': street,
      'city': city,
      'state': state,
      'zipCode': zipCode,
      'phone': phone,
      'isDefault': isDefault,
    };
  }

  @override
  List<Object?> get props => [id, label, street, city, state, zipCode, phone, isDefault];
}

class AddressNotifier extends StateNotifier<List<Address>> {
  AddressNotifier() : super([]);

  Future<void> addAddress(Address address) async {
    if (address.isDefault) {
      state = state.map((a) => a.copyWith(isDefault: false)).toList();
    }
    state = [...state, address];
  }

  void removeAddress(String id) {
    state = state.where((a) => a.id != id).toList();
  }

  void updateAddress(Address address) {
    state = state.map((a) => a.id == address.id ? address : a).toList();
  }

  void setDefault(String id) {
    state = state.map((a) => a.copyWith(isDefault: a.id == id)).toList();
  }
}
