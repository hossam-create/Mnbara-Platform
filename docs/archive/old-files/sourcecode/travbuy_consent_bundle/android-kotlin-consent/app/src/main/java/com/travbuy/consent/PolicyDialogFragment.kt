package com.travbuy.consent
import android.app.Dialog
import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.DialogFragment
import android.view.LayoutInflater
import com.travbuy.consent.databinding.DialogPolicyBinding
class PolicyDialogFragment: DialogFragment(){
  override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
    val binding = DialogPolicyBinding.inflate(LayoutInflater.from(requireContext()))
    binding.tvTitle.text = if (LocaleUtils.isArabic()) "سياسة الخصوصية" else "Privacy Policy"
    binding.tvUpdated.text = if (LocaleUtils.isArabic()) "آخر تحديث: من الخادم" else "Last updated: from server"
    binding.tvBody.text = PolicyTexts.arabic
    return AlertDialog.Builder(requireContext()).setView(binding.root)
      .setPositiveButton(if (LocaleUtils.isArabic()) "حسنًا" else "OK", null).create()
  }
}
