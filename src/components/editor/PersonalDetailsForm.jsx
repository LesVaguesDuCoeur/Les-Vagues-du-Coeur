import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCV } from '../../store/cvStore';
import { Upload, X } from 'lucide-react';

const PersonalDetailsForm = () => {
  const { state, updatePersonalInfo } = useCV();
  const { register, watch, setValue } = useForm({
    defaultValues: state.personalInfo
  });

  // Watch all fields
  const values = watch();

  // Sync form with store on change
  useEffect(() => {
    const timer = setTimeout(() => {
        updatePersonalInfo(values);
    }, 300);
    return () => clearTimeout(timer);
  }, [values]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setValue('photo', null);
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-800">Informations Personnelles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Photo Upload */}
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo de profil</label>
            <div className="flex items-center gap-4">
                {values.photo ? (
                    <div className="relative w-20 h-20">
                        <img src={values.photo} alt="Preview" className="w-full h-full object-cover rounded-full border" />
                        <button
                            onClick={removePhoto}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border border-dashed border-gray-300">
                        <Upload size={24} className="text-gray-400" />
                    </div>
                )}
                <div className="flex-1">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG jusqu'à 2MB. Recommandé carré.</p>
                </div>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Prénom</label>
          <input
            {...register("firstName")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input
            {...register("lastName")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
          <input
            {...register("phone")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            {...register("email")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
          <input
            {...register("linkedin")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ville</label>
          <input
            {...register("city")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Phrase d'accroche / Objectif</label>
          <textarea
            {...register("tagline")}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;
