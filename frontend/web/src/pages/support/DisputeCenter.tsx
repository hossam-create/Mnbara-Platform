import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function DisputeCenter() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-20 px-4 font-sans">
      <div className="max-w-3xl mx-auto">
         {/* Header */}
         <div className="flex justify-between items-center mb-8">
             <div>
                <h1 className="text-2xl font-bold text-gray-900">Dispute Resolution Center</h1>
                <p className="text-gray-500 text-sm">Case ID: #NEW-CASE-001</p>
             </div>
             <Link to="/help" className="text-sm font-bold text-gray-400 hover:text-gray-900">Cancel</Link>
         </div>

         {/* Progress Bar */}
         <div className="bg-white rounded-full h-2 mb-10 overflow-hidden flex">
             <div className={`h-full bg-blue-600 transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
         </div>

         {/* Steps */}
         <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
             
             {/* Step 1: Select Type */}
             {step === 1 && (
                 <div className="p-8 animate-fade-in">
                     <h2 className="text-xl font-bold mb-6">What is the issue?</h2>
                     <div className="space-y-4">
                         {['I did not receive my item', 'Item arrived damaged', 'Item is not as described', 'Billing issue'].map((reason) => (
                             <label key={reason} className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                                 <input type="radio" name="reason" className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
                                 <span className="ml-3 font-medium text-gray-700">{reason}</span>
                             </label>
                         ))}
                     </div>
                     <div className="mt-8 flex justify-end">
                         <button onClick={() => setStep(2)} className="btn-primary px-8 py-3">Continue</button>
                     </div>
                 </div>
             )}

             {/* Step 2: Select Order */}
             {step === 2 && (
                 <div className="p-8 animate-fade-in">
                     <h2 className="text-xl font-bold mb-6">Select the affected order</h2>
                     <div className="space-y-4">
                         {/* Mock Order */}
                         <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                             <input type="radio" name="order" className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
                             <div className="ml-4 flex-1">
                                 <div className="flex justify-between">
                                     <span className="font-bold text-gray-900">iPhone 15 Pro Max</span>
                                     <span className="text-sm text-gray-500">Order #8821</span>
                                 </div>
                                 <div className="text-sm text-gray-500 mt-1">Traveler: Ahmed S. • Nov 24, 2024</div>
                             </div>
                         </label>
                         
                         <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                             <input type="radio" name="order" className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
                             <div className="ml-4 flex-1">
                                 <div className="flex justify-between">
                                     <span className="font-bold text-gray-900">Nike Air Jordan</span>
                                     <span className="text-sm text-gray-500">Order #7732</span>
                                 </div>
                                 <div className="text-sm text-gray-500 mt-1">Traveler: Sarah M. • Nov 20, 2024</div>
                             </div>
                         </label>
                     </div>
                     <div className="mt-8 flex justify-between">
                         <button onClick={() => setStep(1)} className="text-gray-500 font-bold hover:text-gray-900">Back</button>
                         <button onClick={() => setStep(3)} className="btn-primary px-8 py-3">Continue</button>
                     </div>
                 </div>
             )}

             {/* Step 3: Evidence */}
             {step === 3 && (
                 <div className="p-8 animate-fade-in">
                     <h2 className="text-xl font-bold mb-6">Provide Details & Evidence</h2>
                     <textarea className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 mb-6" placeholder="Describe exactly what happened..."></textarea>
                     
                     <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                         <div className="text-4xl mb-2">📷</div>
                         <div className="font-bold text-gray-700">Upload Photos</div>
                         <div className="text-xs text-gray-400">Proof of damage or chat screenshots</div>
                     </div>

                     <div className="mt-8 flex justify-between items-center">
                         <button onClick={() => setStep(2)} className="text-gray-500 font-bold hover:text-gray-900">Back</button>
                         <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors">
                             Submit Claim
                         </button>
                     </div>
                 </div>
             )}
         </div>
         
         <div className="mt-8 text-center text-xs text-gray-400 max-w-lg mx-auto">
             By submitting this claim, you agree to MnBarh's <Link to="/legal/user-agreement" className="underline">Arbitration Rules</Link>. 
             False claims may result in account suspension.
         </div>
      </div>
    </div>
  );
}
