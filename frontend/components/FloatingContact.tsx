
import React from 'react';

const FloatingContact: React.FC = () => {
  const whatsappNumber = "994502000000"; // Nümunə nömrə
  const messengerUsername = "azfin"; // Nümunə istifadəçi adı

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-white rounded-[1.2rem] shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden"
        title="WhatsApp ilə əlaqə"
      >
        <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-10 group-hover:hidden"></div>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
          className="w-full h-full object-contain p-2"
        />

        {/* Tooltip */}
        <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
          WhatsApp
        </span>
      </a>

      {/* Messenger Button */}
      <a
        href={`https://m.me/${messengerUsername}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-white rounded-[1.2rem] shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden"
        title="Messenger ilə əlaqə"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/b/be/Facebook_Messenger_logo_2020.svg"
          alt="Messenger"
          className="w-full h-full object-contain p-2"
        />

        {/* Tooltip */}
        <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
          Messenger
        </span>
      </a>
    </div>
  );
};

export default FloatingContact;
