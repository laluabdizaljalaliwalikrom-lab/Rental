import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bike, Menu, ArrowUpRight, Globe, Camera, Loader2,
  Activity, CheckCircle2, Navigation, Star, Search, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/Badge'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const defaultTranslations = {
  id: {
    nav: { fleet: 'Armada', tech: 'Teknologi', system: 'Sistem', start: 'MULAI SEWA' },
    hero: {
      sub: 'Mobilitas Premium',
      title: 'Mendefinisikan Ulang Pergerakan Urban.',
      italic: 'Urban',
      desc: 'Desain minimalis, performa maksimal. Armada premium kami dirancang untuk kecepatan, kenyamanan, dan efisiensi di setiap jalanan kota.',
      btn: 'JELAJAHI ARMADA',
      badge: 'Standar Global',
      badgeDesc: 'Tersertifikasi Ramah Lingkungan'
    },
    catalog: {
      title: 'Armada Aktif.',
      search: 'Cari model...',
      loading: 'Mengindeks Armada',
      book: 'PESAN SEKARANG',
      rented: 'SEDANG BERPETUALANG',
      startPrice: 'Harga mulai / jam'
    },
    stats: {
      total: 'Total Armada',
      available: 'Tersedia',
      rented: 'Berpetualang',
      rating: 'Kepuasan'
    },
    footer: {
      terms: 'Ketentuan',
      policy: 'Privasi',
      contact: 'Kontak'
    },
    modal: {
      title: 'Reservasi Armada.',
      vehicle: 'Kendaraan',
      name: 'Nama Lengkap',
      phone: 'WhatsApp',
      idType: 'Jenis Identitas',
      idNum: 'Nomor Identitas',
      address: 'Alamat / Hotel',
      upload: 'Unggah Foto Identitas',
      duration: 'Durasi',
      unit: 'Satuan',
      hours: 'Jam',
      days: 'Hari',
      total: 'Total Investasi',
      btn: 'KONFIRMASI PESANAN',
      processing: 'Memproses...',
      gateway: 'Menghubungkan ke gerai aman',
      addons: 'Aksesoris Tambahan'
    },
    auth: {
      login: 'MASUK',
      portal: 'PANEL ADMIN'
    }
  },
  en: {
    nav: { fleet: 'Fleet', tech: 'Tech', system: 'System', start: 'START RIDE' },
    hero: {
      sub: 'Premium Mobility',
      title: 'Redefining Urban Motion.',
      italic: 'Urban',
      desc: 'Minimalist design, maximum performance. Our premium fleet is engineered for speed, comfort, and efficiency in every city street.',
      btn: 'EXPLORE FLEET',
      badge: 'Global Standard',
      badgeDesc: 'Certified Eco-Friendly'
    },
    catalog: {
      title: 'Active Fleet.',
      search: 'Search models...',
      loading: 'Indexing Fleet',
      book: 'BOOK NOW',
      rented: 'OUT EXPLORING',
      startPrice: 'Starting Price / hr'
    },
    stats: {
      total: 'Total Fleet',
      available: 'Available',
      rented: 'Exploring',
      rating: 'Satisfaction'
    },
    footer: {
      terms: 'Terms',
      policy: 'Policy',
      contact: 'Contact'
    },
    modal: {
      title: 'Fleet Reservation.',
      vehicle: 'Vehicle',
      name: 'Full Name',
      phone: 'Phone',
      idType: 'ID Type',
      idNum: 'ID Number',
      address: 'Address / Station',
      upload: 'Upload Identity',
      duration: 'Duration',
      unit: 'Unit',
      hours: 'Hours',
      days: 'Days',
      total: 'Total Investment',
      btn: 'SECURE BOOKING',
      processing: 'Finalizing...',
      gateway: 'Connecting to secure gateway',
      addons: 'Optional Add-ons'
    },
    auth: {
      login: 'LOGIN',
      portal: 'ADMIN PORTAL'
    }
  }
}

export default function LandingPage() {
  const [lang, setLang] = useState('id')
  const [siteSettings, setSiteSettings] = useState(null)

  const [bikes, setBikes] = useState([])
  const [fleetStats, setFleetStats] = useState({ total: 0, available: 0, rented: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedBike, setSelectedBike] = useState(null)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingStep, setBookingStep] = useState('form')
  const [scrolled, setScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [availableAddons, setAvailableAddons] = useState([])

  // Merge settings into translations
  const t = siteSettings ? {
    ...defaultTranslations[lang],
    hero: {
      ...defaultTranslations[lang].hero,
      sub: lang === 'id' ? siteSettings.promo_text_id : siteSettings.promo_text_en,
      title: lang === 'id' ? siteSettings.hero_title_id : siteSettings.hero_title_en,
      desc: lang === 'id' ? siteSettings.hero_desc_id : siteSettings.hero_desc_en,
    },
    stats: {
      ...defaultTranslations[lang].stats,
      totalVal: fleetStats.total,
      availableVal: fleetStats.available,
      rentedVal: fleetStats.rented,
      ratingVal: siteSettings.stats_rating
    }
  } : {
    ...defaultTranslations[lang],
    stats: {
      ...defaultTranslations[lang].stats,
      totalVal: fleetStats.total,
      availableVal: fleetStats.available,
      rentedVal: fleetStats.rented,
      ratingVal: "4.9/5"
    }
  }

  const [bookingData, setBookingData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    identity_type: 'KTP',
    identity_number: '',
    duration: 1,
    unit: 'hour',
    selected_addons: []
  })
  const [identityImage, setIdentityImage] = useState(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)

    async function initPage() {
      // Fetch Fleet (Essential)
      try {
        const fleetData = await apiFetch('/api/fleet/')
        setBikes(fleetData)

        const total = fleetData.length
        const available = fleetData.filter(b => b.status === 'Available').length
        const rented = fleetData.filter(b => b.status === 'Rented').length
        setFleetStats({ total, available, rented })
      } catch (error) {
        console.error("Gagal memuat armada:", error)
      }

      // Fetch Settings (Optional fallback)
      try {
        const settingsData = await apiFetch('/api/settings/landing')
        if (settingsData) setSiteSettings(settingsData)
      } catch (error) {
        console.error("Gagal memuat pengaturan landing:", error)
      }

      // Fetch Addons
      try {
        const addonsData = await apiFetch('/api/addons/')
        setAvailableAddons(addonsData.filter(a => a.is_active))
      } catch (e) { console.error(e) }

      setLoading(false)
    }
    initPage()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const filteredBikes = bikes.filter(b =>
    (b.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (b.brand?.toLowerCase() || '').includes(search.toLowerCase())
  )

  const handleOpenBooking = (bike) => {
    if (bike.status !== 'Available') return;
    setSelectedBike(bike)
    setIsBookingOpen(true)
    setBookingStep('form')
    setBookingData({
      ...bookingData,
      unit: 'hour',
      duration: 1,
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      identity_number: '',
      selected_addons: []
    })
    setIdentityImage(null)
  }

  const totalPrice = selectedBike ? (
    (bookingData.unit === 'hour'
      ? selectedBike.price_per_hour * bookingData.duration
      : selectedBike.price_per_day * bookingData.duration) +
    (bookingData.selected_addons.reduce((acc, a) => acc + a.price, 0) * bookingData.duration)
  ) : 0

  const handleProcessPayment = async () => {
    try {
      setSubmitting(true)
      setBookingStep('payment')

      let identity_image_url = null
      if (identityImage) {
        const formData = new FormData()
        formData.append('file', identityImage)
        try {
          const uploadRes = await apiFetch('/api/rentals/upload-identity', {
            method: 'POST',
            body: formData
          })
          identity_image_url = uploadRes.url
        } catch (e) { console.error(e) }
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
      await apiFetch('/api/rentals/', {
        method: 'POST',
        body: JSON.stringify({
          bike_id: selectedBike.id,
          customer_name: bookingData.customer_name,
          customer_phone: bookingData.customer_phone,
          customer_address: bookingData.customer_address,
          identity_type: bookingData.identity_type,
          identity_number: bookingData.identity_number,
          identity_image_url: identity_image_url,
          rental_type: bookingData.unit === 'hour' ? 'Short' : 'Long',
          duration: bookingData.duration,
          total_price: totalPrice,
          selected_addons: bookingData.selected_addons
        })
      })

      toast.success(lang === 'id' ? "Pemesanan Dikonfirmasi!" : "Ride Confirmed!")
      setIsBookingOpen(false)
      setBikes(prev => prev.map(b => b.id === selectedBike.id ? { ...b, status: 'Rented' } : b))
      // Update stats
      setFleetStats(prev => ({
        ...prev,
        available: prev.available - 1,
        rented: prev.rented + 1
      }))
    } catch (error) {
      toast.error(error.message)
      setBookingStep('form')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] selection:bg-blue-500 selection:text-white font-sans overflow-x-hidden antialiased">
      {/* Navbar Minimalist */}
      {/* Navbar Minimalist */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-1000 ${
        scrolled 
          ? 'py-4 bg-white/80 backdrop-blur-xl border-b border-black/[0.03] shadow-sm' 
          : 'py-8 bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-11 h-11 bg-black flex items-center justify-center rounded-2xl rotate-3 group-hover:rotate-0 transition-all duration-500 shadow-xl shadow-black/10">
              <Bike size={22} className="text-white" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-black text-xl tracking-tighter uppercase leading-none">Zenith</span>
              <span className="text-[10px] font-bold text-blue-600 tracking-[0.3em] uppercase opacity-70">Mobility</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-12 text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">
            <a href="#catalog" className="hover:text-black transition-all hover:tracking-[0.35em] duration-500">{t.nav.fleet}</a>
            <a href="#stats" className="hover:text-black transition-all hover:tracking-[0.35em] duration-500">{t.nav.tech}</a>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center p-1 bg-black/[0.03] rounded-full border border-black/[0.05]">
              <button
                onClick={() => setLang('id')}
                className={`px-4 py-1.5 text-[9px] font-bold rounded-full transition-all ${lang === 'id' ? 'bg-white text-black shadow-md' : 'text-black/30 hover:text-black'}`}
              >
                ID
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-4 py-1.5 text-[9px] font-bold rounded-full transition-all ${lang === 'en' ? 'bg-white text-black shadow-md' : 'text-black/30 hover:text-black'}`}
              >
                EN
              </button>
            </div>

            <Link to="/login">
              <Button className="hidden sm:flex rounded-2xl bg-black hover:bg-blue-600 px-8 py-6 text-[10px] font-bold tracking-[0.2em] text-white transition-all shadow-xl shadow-black/5">
                {t.auth.login}
              </Button>
            </Link>

            <button
              className="md:hidden p-3 bg-black/5 rounded-xl text-black hover:bg-black/10 transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 bg-white/98 backdrop-blur-2xl z-50 flex flex-col items-center justify-center gap-12 transition-all duration-700 ease-[cubic-bezier(0.2,0,0,1)] lg:hidden ${
          isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}>
          <button 
            className="absolute top-8 right-8 p-4 bg-black/5 rounded-full"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Plus size={24} className="rotate-45" />
          </button>
          
          <div className="flex flex-col items-center gap-8 text-3xl font-black tracking-tighter text-black uppercase">
            <a href="#catalog" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">{t.nav.fleet}</a>
            <a href="#stats" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">{t.nav.tech}</a>
          </div>
          
          <div className="flex gap-8">
            <button onClick={() => setLang('id')} className={`text-sm font-black tracking-widest ${lang === 'id' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-black/20'}`}>INDONESIA</button>
            <button onClick={() => setLang('en')} className={`text-sm font-black tracking-widest ${lang === 'en' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-black/20'}`}>ENGLISH</button>
          </div>

          <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full max-w-[280px]">
            <Button className="w-full rounded-2xl bg-black px-12 py-8 text-xs font-bold tracking-[0.2em] shadow-2xl shadow-black/10 text-white">
              {t.auth.login}
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-24 md:pt-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-10 animate-reveal">
            <div className="space-y-4">
              <span className="inline-block text-[10px] font-black tracking-[0.4em] text-blue-600 uppercase">{t.hero.sub}</span>
              <h1 className="text-6xl md:text-8xl xl:text-9xl font-medium tracking-tighter leading-[0.9] text-black">
                {t.hero.title && t.hero.italic && t.hero.title.includes(t.hero.italic) ? (
                  <>
                    {t.hero.title.split(t.hero.italic)[0]}
                    <span className="italic font-serif opacity-30">{t.hero.italic}</span>
                    {t.hero.title.split(t.hero.italic)[1]}
                  </>
                ) : (t.hero.title || 'Zenith Mobility')}
              </h1>
            </div>
            <p className="text-[#666] text-lg md:text-xl max-w-lg leading-relaxed font-light">
              {t.hero.desc}
            </p>
            <div className="flex flex-wrap gap-6 items-center">
              <a href="#catalog">
                <Button className="h-16 px-10 rounded-full bg-black hover:bg-blue-600 text-white font-bold text-xs tracking-widest transition-all text-white">
                  {t.hero.btn} <ArrowUpRight className="ml-2" size={18} />
                </Button>
              </a>
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-[#f8f9fa] bg-slate-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-black/5 animate-float border border-black/5">
              <img
                src={siteSettings?.hero_image_url || "/premium_hero_bike_1778159126854.png"}
                alt="Main Bike"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-black/5 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <Globe size={24} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">{t.hero.badge}</p>
                <p className="text-sm font-bold">{t.hero.badgeDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="py-32 bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-medium tracking-tight">{t.catalog.title}</h2>
              <div className="w-20 h-1 bg-blue-600" />
            </div>
            <div className="relative group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-black transition-colors" size={18} />
              <input
                placeholder={t.catalog.search}
                className="bg-transparent border-b border-[#eee] focus:border-black py-4 pl-8 outline-none text-sm font-medium w-64 md:w-80 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#999]">{t.catalog.loading}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
              {filteredBikes.map(bike => (
                <div key={bike.id} className={`group cursor-pointer ${bike.status !== 'Available' ? 'opacity-80' : ''}`}>
                  <div className="aspect-[4/3] bg-[#f8f9fa] rounded-3xl overflow-hidden relative mb-8 border border-black/[0.03]">
                    <img
                      src={bike.image_url || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=2070'}
                      alt={bike.name}
                      className={`w-full h-full object-cover transition-all duration-700 scale-100 group-hover:scale-105 ${bike.status !== 'Available' ? 'grayscale' : 'grayscale-[0.2] group-hover:grayscale-0'}`}
                    />

                    <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                      <Badge className="bg-white/80 backdrop-blur-md text-black border-none text-[9px] font-bold tracking-widest px-4 py-2 rounded-full uppercase">
                        {bike.type}
                      </Badge>
                      {bike.status !== 'Available' && (
                        <Badge className="bg-red-500 text-white border-none text-[9px] font-bold tracking-widest px-4 py-2 rounded-full uppercase">
                          {t.catalog.rented}
                        </Badge>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        onClick={() => handleOpenBooking(bike)}
                        disabled={bike.status !== 'Available'}
                        className={`${bike.status === 'Available' ? 'bg-white text-black hover:bg-blue-600 hover:text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} rounded-full font-bold text-xs tracking-widest px-8 py-6 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500`}
                      >
                        {bike.status === 'Available' ? t.catalog.book : t.catalog.rented}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{bike.brand}</p>
                      <h3 className="text-2xl font-medium tracking-tight group-hover:text-blue-600 transition-colors">{bike.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-medium tracking-tighter">Rp {bike.price_per_hour.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-[#999] uppercase tracking-widest">{t.catalog.startPrice}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Experience Stats */}
      <section id="stats" className="py-32 bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 lg:grid-cols-4 gap-12">
          {[
            { icon: <Activity size={24} />, label: t.stats.total, value: t.stats.totalVal },
            { icon: <CheckCircle2 size={24} />, label: t.stats.available, value: t.stats.availableVal },
            { icon: <Navigation size={24} />, label: t.stats.rented, value: t.stats.rentedVal },
            { icon: <Star size={24} />, label: t.stats.rating, value: t.stats.ratingVal }
          ].map((stat, i) => (
            <div key={i} className="space-y-4 group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-medium tracking-tighter">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 pb-16 border-b border-black/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <Bike size={16} className="text-white" />
              </div>
              <span className="font-bold text-sm tracking-widest uppercase">Zenith.</span>
            </div>
            <div className="flex gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-[#999]">
              <a href="#" className="hover:text-black">{t.footer.terms}</a>
              <a href="#" className="hover:text-black">{t.footer.policy}</a>
              <a href="#" className="hover:text-black">{t.footer.contact}</a>
            </div>
            <div className="flex gap-4">
              {['FB', 'IG', 'TW'].map(s => (
                <div key={s} className="w-10 h-10 border border-[#eee] rounded-full flex items-center justify-center text-[9px] font-bold hover:border-black cursor-pointer transition-all">
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[9px] font-bold text-[#bbb] uppercase tracking-[0.3em]">© 2026 ZENITH MOBILITY LABS</p>
            <p className="text-[9px] font-bold text-[#bbb] uppercase tracking-[0.3em]">DESIGNED FOR THE FUTURE</p>
          </div>
        </div>
      </footer>

      {/* Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] bg-white border-none rounded-[32px] p-0 flex flex-col shadow-2xl focus:outline-none overflow-hidden">
          <DialogHeader className="p-8 md:p-12 pb-0 text-left">
            <div className="w-14 h-14 bg-black p-4 rounded-2xl mb-6">
              <Bike className="text-white" size={24} />
            </div>
            <DialogTitle className="text-3xl font-medium tracking-tight text-black leading-none">{t.modal.title}</DialogTitle>
            <DialogDescription className="text-[#999] font-bold uppercase tracking-[0.2em] text-[9px] pt-3">
              {t.modal.vehicle}: <span className="text-blue-600">{selectedBike?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-8 md:px-12 pb-8 md:pb-12">

              {bookingStep === 'form' ? (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold tracking-widest text-[#999]">{t.modal.name}</Label>
                      <input
                        placeholder="John Doe"
                        className="w-full bg-transparent border-b border-[#eee] focus:border-black py-3 outline-none text-sm font-medium transition-all"
                        value={bookingData.customer_name}
                        onChange={e => setBookingData({ ...bookingData, customer_name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold tracking-widest text-[#999]">{t.modal.phone}</Label>
                        <input
                          placeholder="0812..."
                          className="w-full bg-transparent border-b border-[#eee] focus:border-black py-3 outline-none text-sm font-medium transition-all"
                          value={bookingData.customer_phone}
                          onChange={e => setBookingData({ ...bookingData, customer_phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold tracking-widest text-[#999]">{t.modal.idType}</Label>
                        <select
                          className="w-full bg-transparent border-b border-[#eee] focus:border-black py-3 outline-none text-sm font-medium transition-all appearance-none"
                          value={bookingData.identity_type}
                          onChange={e => setBookingData({ ...bookingData, identity_type: e.target.value })}
                        >
                          <option value="KTP">KTP</option>
                          <option value="SIM">SIM</option>
                          <option value="Paspor">Paspor</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold tracking-widest text-[#999]">{t.modal.idNum}</Label>
                      <input
                        placeholder={`Your ${bookingData.identity_type} number`}
                        className="w-full bg-transparent border-b border-[#eee] focus:border-black py-3 outline-none text-sm font-medium transition-all"
                        value={bookingData.identity_number}
                        onChange={e => setBookingData({ ...bookingData, identity_number: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold tracking-widest text-[#999]">{t.modal.address}</Label>
                      <input
                        placeholder="Current address"
                        className="w-full bg-transparent border-b border-[#eee] focus:border-black py-3 outline-none text-sm font-medium transition-all"
                        value={bookingData.customer_address}
                        onChange={e => setBookingData({ ...bookingData, customer_address: e.target.value })}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[9px] uppercase font-bold tracking-widest text-[#999]">{t.modal.upload}</Label>
                      <div className="relative">
                        <input
                          id="idUpload"
                          type="file"
                          className="hidden"
                          onChange={e => setIdentityImage(e.target.files[0])}
                        />
                        <label
                          htmlFor="idUpload"
                          className="flex items-center gap-3 py-4 border-b border-[#eee] border-dashed cursor-pointer hover:border-black transition-all"
                        >
                          <Camera className={identityImage ? 'text-blue-600' : 'text-[#ccc]'} size={20} strokeWidth={1.5} />
                          <span className="text-xs font-medium text-[#666]">
                            {identityImage ? identityImage.name : 'Upload Document'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold tracking-widest text-[#999]">{t.modal.duration}</Label>
                        <input
                          type="number"
                          className="w-full bg-transparent border-b border-[#eee] focus:border-black py-3 outline-none text-sm font-medium transition-all"
                          value={bookingData.duration}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            if (bookingData.unit === 'hour' && val > 3) {
                              setBookingData({ ...bookingData, unit: 'day', duration: 1 });
                              toast.info(lang === 'id' ? "Durasi > 3 jam otomatis dialihkan ke paket harian (Daily)" : "Duration > 3 hours automatically switched to Daily package");
                            } else {
                              setBookingData({ ...bookingData, duration: val });
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold tracking-widest text-[#999]">{t.modal.unit}</Label>
                        <select
                          className="w-full bg-transparent border-b border-[#eee] focus:border-black py-3 outline-none text-sm font-medium transition-all appearance-none"
                          value={bookingData.unit}
                          onChange={e => setBookingData({ ...bookingData, unit: e.target.value })}
                        >
                          <option value="hour">{t.modal.hours}</option>
                          <option value="day">{t.modal.days}</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[9px] uppercase font-bold tracking-widest text-[#999]">{t.modal.addons}</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {availableAddons.map(addon => {
                          const isSelected = bookingData.selected_addons.find(a => a.id === addon.id)
                          return (
                            <button
                              key={addon.id}
                              type="button"
                              className={`flex flex-col items-start p-4 rounded-2xl border transition-all text-left ${
                                isSelected ? 'bg-black text-white border-black shadow-lg shadow-black/10' : 'bg-transparent border-[#eee] text-black hover:border-black'
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setBookingData({ ...bookingData, selected_addons: bookingData.selected_addons.filter(a => a.id !== addon.id) })
                                } else {
                                  setBookingData({ ...bookingData, selected_addons: [...bookingData.selected_addons, addon] })
                                }
                              }}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-tight mb-1">{addon.name}</span>
                              <span className={`text-[10px] font-black ${isSelected ? 'text-blue-400' : 'text-blue-600'}`}>+ Rp {addon.price.toLocaleString()}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-bold text-[#999] uppercase tracking-widest">{t.modal.total}</p>
                        <p className="text-3xl font-medium tracking-tighter text-black">Rp {totalPrice.toLocaleString()}</p>
                      </div>
                    </div>

                    <Button
                      className="w-full h-16 rounded-2xl bg-black hover:bg-blue-600 text-white font-bold text-xs tracking-widest transition-all shadow-xl shadow-black/5 text-white"
                      onClick={handleProcessPayment}
                      disabled={!bookingData.customer_name || !bookingData.customer_phone || submitting}
                    >
                      {submitting ? <Loader2 className="animate-spin" /> : t.modal.btn}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-reveal">
                  <div className="relative">
                    <div className="w-20 h-20 border-[2px] border-[#eee] border-t-black rounded-full animate-spin" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-medium tracking-tight text-black uppercase">{t.modal.processing}</h3>
                    <p className="text-[#999] font-bold uppercase tracking-widest text-[9px]">{t.modal.gateway}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes reveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-reveal { animation: reveal 1s cubic-bezier(0.2, 0, 0, 1) forwards; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
        
        html { scroll-behavior: smooth; }
      `}} />
    </div>
  )
}
