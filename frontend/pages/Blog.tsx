
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { BlogItem } from '../types';
import { fetchBlogPosts } from '../utils/fetchData';
import ImageWithFallback from '../components/ImageWithFallback';
import { useContent } from '../lib/ContentContext';

const Blog: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchBlogPosts()
      .then((posts) => {
        if (isMounted) {
          setBlogPosts(posts);
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
  }, []);

  const { content } = useContent();
  const blogContent = content.blog;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Redesigned Split Header to match the overall site design */}
      <div className="relative bg-slate-50 border-b border-slate-100 py-24 overflow-hidden">
        {blogContent.heroImage && (
          <div className="absolute inset-0 z-0">
            <img src={blogContent.heroImage} className="w-full h-full object-cover opacity-10" alt="" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent"></div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6 text-accent font-black uppercase tracking-[0.4em] text-[10px]">
                <span className="w-8 h-[1px] bg-accent"></span>
                {blogContent.blogBadge}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight leading-tight uppercase italic">
                {blogContent.heroTitlePrefix} <span className="text-accent">{blogContent.heroTitleHighlight}</span>
              </h1>
            </div>
            <p className="text-slate-500 font-bold text-xs max-w-xs border-l-2 border-accent pl-6 pb-2 uppercase tracking-widest leading-relaxed">
              {blogContent.heroSummary}
            </p>
          </div>
        </div>
      </div>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Blog Grid - 3 items per row on large screens */}
            <div className="lg:col-span-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                  <div className="col-span-full text-center text-slate-400 font-bold py-12">
                    {blogContent.loadingText}
                  </div>
                ) : blogPosts.length === 0 ? (
                  <div className="col-span-full text-center text-slate-400 font-bold py-12">
                    {blogContent.emptyText}
                  </div>
                ) : (
                  blogPosts.map((post) => (
                    <article key={post.id} className="bg-white rounded-lg overflow-hidden border border-slate-100 group hover:shadow-xl transition-all duration-500">
                      <div className="relative h-56 overflow-hidden bg-slate-100">
                        <ImageWithFallback
                          src={post.image}
                          alt={post.title}
                          imgClassName="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                          placeholderClassName="w-full h-full"
                          placeholderText="no-image"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-accent text-white px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest shadow-lg">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="flex items-center gap-4 mb-4 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-accent" /> {post.date}
                          </div>
                        </div>
                        <h2 className="text-xl font-black text-primary mb-4 leading-tight group-hover:text-accent transition-colors italic uppercase tracking-tight">
                          {post.title}
                        </h2>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-2 font-medium">
                          {post.excerpt}
                        </p>
                        <Link to={`/blog/${post.id}`} className="inline-flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest group-hover:text-accent transition-colors">
                          {blogContent.readMoreText} <ArrowRight className="h-3 w-3 text-accent" />
                        </Link>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
