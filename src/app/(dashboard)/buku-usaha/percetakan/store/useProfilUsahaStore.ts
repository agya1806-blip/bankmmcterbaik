"use client";

import { useBusinessStore, BusinessProfile } from "@/store/useBusinessStore";

export interface ProfilUsaha {
  logo: string;
  nama: string;
  alamat: string;
  noWA: string;
  subLayanan: string[];
}

export interface ProfilUsahaState {
  profil: ProfilUsaha;
  setLogo: (logo: string) => void;
  setNama: (nama: string) => void;
  setAlamat: (alamat: string) => void;
  setNoWA: (noWA: string) => void;
  setSubLayanan: (list: string[]) => void;
  tambahSubLayanan: (item: string) => void;
  hapusSubLayanan: (index: number) => void;
  updateProfil: (data: Partial<ProfilUsaha>) => void;
  resetProfil: () => void;
}

const DEFAULT_PROFIL: ProfilUsaha = {
  logo: "",
  nama: "Mughis Group",
  alamat: "Samalanga, Bireuen, Aceh",
  noWA: "085217706587",
  subLayanan: [
    "Jual Laptop Baru & Bekas",
    "Penerbit & Percetakan",
    "Desain Grafis & Logo",
    "Jasa Bordir & Sablon",
  ],
};

function mapCentralToLegacy(central: { logoUrl: string; namaUsaha: string; alamat: string; noWhatsapp: string; subLayanan: string[] }): ProfilUsaha {
  return {
    logo: central.logoUrl,
    nama: central.namaUsaha,
    alamat: central.alamat,
    noWA: central.noWhatsapp.startsWith("62") ? "0" + central.noWhatsapp.slice(2) : central.noWhatsapp,
    subLayanan: central.subLayanan,
  };
}

export function useProfilUsahaStore(): ProfilUsahaState {
  const profile = useBusinessStore((s) => s.profile);

  const setLogo = (logo: string) => useBusinessStore.getState().setProfileLogo(logo);
  const setNama = (nama: string) => useBusinessStore.getState().setProfileNama(nama);
  const setAlamat = (alamat: string) => useBusinessStore.getState().setProfileAlamat(alamat);
  const setNoWA = (noWA: string) => {
    const clean = noWA.replace(/[^0-9]/g, "");
    const intl = clean.startsWith("0") ? "62" + clean.slice(1) : clean.startsWith("62") ? clean : "62" + clean;
    useBusinessStore.getState().setProfileWhatsapp(intl);
  };
  const setSubLayanan = (list: string[]) => {
    const store = useBusinessStore.getState();
    store.updateProfile({ subLayanan: list });
  };
  const tambahSubLayanan = (item: string) => useBusinessStore.getState().tambahSubLayanan(item);
  const hapusSubLayanan = (index: number) => useBusinessStore.getState().hapusSubLayanan(index);
  const updateProfil = (data: Partial<ProfilUsaha>) => {
    const store = useBusinessStore.getState();
    const mapped: Partial<BusinessProfile> = {};
    if (data.logo !== undefined) mapped.logoUrl = data.logo;
    if (data.nama !== undefined) mapped.namaUsaha = data.nama;
    if (data.alamat !== undefined) mapped.alamat = data.alamat;
    if (data.noWA !== undefined) {
      const clean = data.noWA.replace(/[^0-9]/g, "");
      mapped.noWhatsapp = clean.startsWith("0") ? "62" + clean.slice(1) : clean.startsWith("62") ? clean : "62" + clean;
    }
    if (data.subLayanan !== undefined) mapped.subLayanan = data.subLayanan;
    store.updateProfile(mapped);
  };
  const resetProfil = () => {
    useBusinessStore.getState().resetProfile();
    const store = useBusinessStore.getState();
    store.updateProfile({
      logoUrl: DEFAULT_PROFIL.logo,
      namaUsaha: DEFAULT_PROFIL.nama,
      alamat: DEFAULT_PROFIL.alamat,
      noWhatsapp: "62" + DEFAULT_PROFIL.noWA.slice(1),
      subLayanan: DEFAULT_PROFIL.subLayanan,
    });
  };

  return {
    profil: mapCentralToLegacy(profile),
    setLogo,
    setNama,
    setAlamat,
    setNoWA,
    setSubLayanan,
    tambahSubLayanan,
    hapusSubLayanan,
    updateProfil,
    resetProfil,
  };
}
