import React, { useEffect, useMemo, useState } from 'react';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  imgClassName?: string;
  placeholderClassName?: string;
  placeholderText?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  imgClassName = '',
  placeholderClassName = '',
  placeholderText = 'no-image',
}) => {
  const [failed, setFailed] = useState(false);

  const hasValidSrc = useMemo(() => !!src && !failed, [src, failed]);

  const handleError = () => setFailed(true);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (hasValidSrc) {
    return <img src={src!} alt={alt} className={imgClassName} onError={handleError} />;
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`bg-slate-100 text-slate-400 uppercase tracking-[0.4em] text-[10px] font-black flex items-center justify-center ${placeholderClassName}`}
    >
      {placeholderText}
    </div>
  );
};

export default ImageWithFallback;
