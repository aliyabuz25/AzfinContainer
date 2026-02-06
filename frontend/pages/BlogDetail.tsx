
import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Facebook, Linkedin, Twitter, Share2 } from 'lucide-react';
import { BlogItem } from '../types';
import { fetchBlogPostById } from '../utils/fetchData';
import ImageWithFallback from '../components/ImageWithFallback';
import { parseBBCode } from '../utils/bbcode';

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!id) {
      setLoading(false);
      return;
    }

    fetchBlogPostById(id)
      .then((data) => {
        if (isMounted) {
          setPost(data);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!loading && !post) {
    return <Navigate to="/blog" replace />;
  }

  if (loading || !post) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-600 font-bold">Bloq məlumatları yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Article Content Area - Minimalist & Light */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">

        {/* Back Navigation */}
        <div className="mb-12">
          <Link to="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-600 font-bold uppercase tracking-widest text-[10px] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Bloqa qayıt
          </Link>
        </div>

        {/* Header Info */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 text-amber-600 font-bold text-[10px] uppercase tracking-[0.4em] mb-6">
            <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-sm">{post.category}</span>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1.5 text-slate-400"><Calendar className="h-3 w-3" /> {post.date}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-8 max-w-3xl mx-auto">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <User className="h-4 w-4 text-amber-500" /> Müəllif: {post.author}
          </div>
        </div>

        {/* Centered Topic Image - Moderate Size */}
        <div className="mb-16 rounded-xl overflow-hidden shadow-2xl bg-slate-50 border border-slate-100 max-w-2xl mx-auto">
          <ImageWithFallback
            src={post.image}
            alt={post.title}
            imgClassName="w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
            placeholderClassName="min-h-[320px] w-full"
            placeholderText="no-image"
          />
        </div>

        {/* Content Body */}
        <div className="prose prose-slate prose-lg max-w-none">
          <div
            className="text-slate-600 leading-relaxed text-xl font-medium mb-10"
            dangerouslySetInnerHTML={{ __html: parseBBCode(post.content) }}
          />

        </div>

        {/* Social Media Sharing Section */}
        <div className="mt-20 pt-12 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-widest text-[10px]">
                <Share2 className="h-4 w-4 text-amber-500" /> Paylaş:
              </div>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="w-10 h-10 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="#" className="w-10 h-10 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['#Audit', '#Vergi', '#Azfin'].map(tag => (
                <span key={tag} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
