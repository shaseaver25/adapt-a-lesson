import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginModal } from '@/components/LoginModal';
import { StickyCtaBar } from '@/components/landing/StickyCtaBar';
import { SocialProofBar } from '@/components/landing/SocialProofBar';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { TestimonialCarousel } from '@/components/landing/TestimonialCarousel';
import { Play, Clock, Globe, Shield, Users, Sparkles, FileDown, ArrowRight, Zap, Languages, CheckCircle2, FileText, Linkedin, Mail } from 'lucide-react';
import shannonPhoto from '@/assets/shannon-seaver.jpg';
import jenaPhoto from '@/assets/jena-zangs.jpg';
import { Logo } from '@/components/ui/Logo';

// Video player component for back-to-back videos
function GettingStartedVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videos = ['/videos/getting-started-1.mp4', '/videos/getting-started-2.mp4'];
  const handleVideoEnd = () => {
    if (currentVideo < videos.length - 1) {
      setCurrentVideo(prev => prev + 1);
    } else {
      setCurrentVideo(0);
      setIsPlaying(false);
    }
  };
  useEffect(() => {
    if (videoRef.current && isPlaying) {
      videoRef.current.play();
    }
  }, [currentVideo, isPlaying]);
  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };
  return <div className="aspect-video bg-foreground relative">
      <video ref={videoRef} src={videos[currentVideo]} onEnded={handleVideoEnd} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} className="w-full h-full object-cover" controls playsInline />
      {!isPlaying && <button onClick={handlePlay} className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-secondary ml-1" fill="currentColor" />
          </div>
        </button>}
      <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
        {currentVideo + 1} / {videos.length}
      </div>
    </div>;
}
export default function Landing() {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  useEffect(() => {
    if (!loading && user) {
      navigate('/studio');
    }
  }, [user, loading, navigate]);
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  return <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 opacity-40">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/30 blur-[100px] animate-pulse" style={{
        top: '20%',
        left: '80%',
        animationDuration: '8s'
      }} />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-secondary/30 blur-[100px] animate-pulse" style={{
        top: '80%',
        left: '20%',
        animationDuration: '10s',
        animationDelay: '2s'
      }} />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-accent/30 blur-[100px] animate-pulse" style={{
        top: '40%',
        left: '40%',
        animationDuration: '12s',
        animationDelay: '4s'
      }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="#" className="flex items-center gap-3">
            <Logo size="xlarge" />
          </a>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('how-it-works')} className="text-foreground/80 hover:text-primary transition-colors font-medium">
              How It Works
            </button>
            <button onClick={() => scrollToSection('features')} className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Features
            </button>
            <button onClick={() => scrollToSection('videos')} className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Demos
            </button>
            <Link to="/pricing" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Pricing
            </Link>
            <button onClick={() => setLoginOpen(true)} className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Redesigned */}
      <section className="min-h-screen flex items-center pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-accent/20 to-primary/20 px-4 py-2 rounded-full text-sm font-semibold mb-6 text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              Built by Teachers, for Teachers
            </div>
            
            {/* Main Headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              Create Differentiated Lessons in{' '}
              <span className="text-primary">
                60 Seconds
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg">
              AI-powered lesson plans, authentic assessments, and multilingual support. 
              Because every student deserves learning that fits them.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-10">
              <button onClick={() => setLoginOpen(true)} className="px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                Start Creating Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => scrollToSection('videos')} className="px-6 py-4 border-2 border-foreground/20 text-foreground rounded-full font-semibold hover:bg-muted transition-all flex items-center gap-2">
                <Play className="w-5 h-5" />
                Watch 2-Min Demo
              </button>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-8 md:gap-12 pt-6 border-t border-border/50">
              <div>
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">10+</div>
                <div className="text-sm text-muted-foreground">Hours Saved Weekly</div>
              </div>
              <div>
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">12+</div>
                <div className="text-sm text-muted-foreground">Languages Supported</div>
              </div>
              <div>
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">AI-Proof Assessments</div>
              </div>
            </div>
          </div>

          {/* Product Preview instead of Login Card */}
          <ProductPreview />
        </div>
      </section>

      {/* Social Proof Bar */}
      <SocialProofBar />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 md:px-8 bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent font-bold uppercase tracking-widest text-sm mb-4 block">
              Simple as 1-2-3
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From topic to complete lesson package in under a minute
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[{
            step: '01',
            icon: FileText,
            title: 'Enter Your Topic',
            desc: "Tell us what you're teaching and your learning objectives. That's it.",
            color: 'bg-primary'
          }, {
            step: '02',
            icon: Users,
            title: 'Set Student Needs',
            desc: 'Define reading levels, ELL students, IEP accommodations. We handle the rest.',
            color: 'bg-secondary'
          }, {
            step: '03',
            icon: Zap,
            title: 'Get Complete Lessons',
            desc: 'Receive differentiated handouts, teacher guide, multilingual audio in 60 seconds.',
            color: 'bg-accent'
          }].map((item, i) => {
            const Icon = item.icon;
            return <div key={i} className="relative">
                  <div className="bg-background rounded-2xl p-8 shadow-lg border border-border/50 hover:-translate-y-2 transition-transform">
                    <div className="text-6xl font-display font-bold text-muted/30 absolute -top-4 -left-2">
                      {item.step}
                    </div>
                    <div className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                  {i < 2 && <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />}
                </div>;
          })}
          </div>

          <div className="text-center mt-12">
            <button onClick={() => setLoginOpen(true)} className="px-8 py-3 bg-primary text-white rounded-full font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Try It Now — Free
            </button>
          </div>
        </div>
      </section>

      {/* Features Section - Condensed to 4 */}
      <section id="features" className="py-24 px-4 md:px-8 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-accent font-bold uppercase tracking-widest text-sm mb-4 block">Core Features</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Stop spending nights on differentiation. Start serving every learner.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[{
            icon: Clock,
            title: 'Save 10+ Hours Weekly',
            desc: 'Stop spending nights on differentiation. Get complete lesson packages in 60 seconds—teacher guide, student handouts, and assessments.',
            highlight: '10+ hours saved'
          }, {
            icon: Users,
            title: 'Serve Every Learner',
            desc: 'Automatic differentiation for multiple reading levels, IEP accommodations, and 504 plans. Every student gets what they need.',
            highlight: 'All students included'
          }, {
            icon: Shield,
            title: 'AI-Proof Assessments',
            desc: "Authentic tasks students can't ChatGPT—process checkpoints, artifacts, and reflection prompts that prove real learning.",
            highlight: 'Real understanding'
          }, {
            icon: Languages,
            title: 'Multilingual Support',
            desc: '12+ languages with auto-generated audio. Spanish, Hmong, Somali, Vietnamese, and more. ELL students hear lessons in their home language.',
            highlight: '12+ languages'
          }].map((feature, i) => {
            const Icon = feature.icon;
            return <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all group">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-lg shrink-0">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-xl font-bold text-white">{feature.title}</h3>
                      </div>
                      <p className="text-white/70 leading-relaxed mb-3">{feature.desc}</p>
                      <span className="inline-flex items-center gap-2 text-accent text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        {feature.highlight}
                      </span>
                    </div>
                  </div>
                </div>;
          })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 md:px-8 bg-gradient-to-b from-background to-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent font-bold uppercase tracking-widest text-sm mb-4 block">
              What Teachers Say
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trusted by Educators
            </h2>
          </div>
          
          <TestimonialCarousel />
        </div>
      </section>

      {/* Videos Section */}
      <section id="videos" className="py-24 px-4 md:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent font-bold uppercase tracking-widest text-sm mb-4 block">
              See It In Action
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Watch How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See exactly how Authentic Learning Studio transforms classroom prep.
            </p>
          </div>

          {/* Main Video */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-background rounded-2xl overflow-hidden shadow-xl">
              <div className="relative w-full" style={{
              paddingTop: '56.25%'
            }}>
                <iframe src="https://player.vimeo.com/video/1147251547?h=1d0d9465af&badge=0&autopause=0&player_id=0&app_id=58479" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" className="absolute top-0 left-0 w-full h-full" title="Getting Started with Authentic Learning Studio" />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-foreground mb-1">
                  Complete Platform Walkthrough
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Watch how quickly you can generate a complete differentiated lesson package.
                </p>
                <a href="/examples/getting-started-example.md" download className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors">
                  <FileDown className="w-4 h-4" />
                  Download Example Lesson
                </a>
              </div>
            </div>
          </div>

          {/* Secondary Videos */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[{
            title: 'Authentic Assessment',
            desc: 'See how our assessments ensure real learning.',
            duration: '5:12',
            exampleUrl: '/examples/authentic-assessment-example.doc',
            videoUrl: '/videos/authentic-assessment.mp4'
          }, {
            title: 'Multilingual Support',
            desc: '12+ languages with automatic audio.',
            duration: '4:08',
            exampleUrl: '/examples/multilingual-support-example.md',
            videoUrl: '/videos/multilingual-support.mp4'
          }, {
            title: 'Rubric Creation',
            desc: 'Generate aligned rubrics instantly.',
            duration: '3:24',
            exampleUrl: '/examples/rubric-example.md',
            videoUrl: '/videos/rubric-creation.mp4'
          }].map((video, i) => <div key={i} className="bg-background rounded-2xl overflow-hidden shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all">
                <div className="aspect-video bg-gradient-to-br from-foreground to-foreground/80 relative">
                  <video src={video.videoUrl} controls className="w-full h-full object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">{video.title}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{video.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-secondary font-semibold text-sm">
                      🎬 {video.duration}
                    </span>
                    <a href={video.exampleUrl} download className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium text-sm transition-colors">
                      <FileDown className="w-4 h-4" />
                      Example
                    </a>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent font-bold uppercase tracking-widest text-sm mb-4 block">
              Meet the Founders
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Built by Educators
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We've been in the classroom. We know the struggle. That's why we built something that actually works.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Shannon Seaver Card */}
            <div className="bg-card rounded-3xl overflow-hidden shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all">
              <div className="aspect-square bg-gradient-to-br from-accent/50 to-primary/50 relative">
                <img src={shannonPhoto} alt="Shannon Seaver" className="w-full h-full object-cover" />
              </div>
              <div className="p-8 text-center">
                <h3 className="font-display text-2xl font-bold text-foreground mb-1">Shannon Seaver</h3>
                <p className="text-secondary font-semibold mb-4">Founder & CEO</p>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Tekne Award-winning National Board Certified Teacher with 15+ years in the classroom. Building the future of differentiated learning.
                </p>
                <div className="flex justify-center gap-3">
                  <a href="https://www.linkedin.com/in/shannon-seaver-nbct-23a2a933/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-foreground hover:bg-secondary hover:text-white transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="mailto:shannon@realpathlearning.com" className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-foreground hover:bg-secondary hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Jena Zangs Card */}
            <div className="bg-card rounded-3xl overflow-hidden shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all">
              <div className="aspect-square bg-gradient-to-br from-accent/50 to-primary/50 relative">
                <img src={jenaPhoto} alt="Jena Zangs" className="w-full h-full object-cover" />
              </div>
              <div className="p-8 text-center">
                <h3 className="font-display text-2xl font-bold text-foreground mb-1">Jena Zangs</h3>
                <p className="text-secondary font-semibold mb-4">Co-Founder & COO</p>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Chief Data & AI Officer at the University of St. Thomas. 10+ years in Higher Education technology and passionate on meeting every learner where they need us with AI.
                </p>
                <div className="flex justify-center gap-3">
                  <a href="https://www.linkedin.com/in/jenaz/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-foreground hover:bg-secondary hover:text-white transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="mailto:jena@realpathlearning.com" className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-foreground hover:bg-secondary hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 md:px-8 bg-gradient-to-br from-secondary to-secondary/90 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to Save 10+ Hours This Week?
          </h2>
          <p className="text-white/90 text-lg md:text-xl mb-8 max-w-xl mx-auto">
            Join educators who are finally spending time teaching, not planning.
          </p>
          <button onClick={() => setLoginOpen(true)} className="px-10 py-4 bg-white text-secondary rounded-full font-bold text-lg shadow-xl hover:bg-foreground hover:text-white hover:-translate-y-1 transition-all inline-flex items-center gap-2">
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-white/60 text-sm mt-4">
            No credit card required · Free forever for basic use
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-8 bg-foreground text-white/70">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Logo size="small" variant="dark" />
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('videos')} className="hover:text-white transition-colors">
              Demos
            </button>
            <button onClick={() => scrollToSection('team')} className="hover:text-white transition-colors">
              Team
            </button>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="mailto:press@realpathlearning.com" className="hover:text-white transition-colors">Press</a>
          </div>
          <div className="text-center md:text-right">
            <p>Questions? Reach out!</p>
            <a href="mailto:support@realpathlearning.com" className="text-white hover:underline">
              support@realpathlearning.com
            </a>
          </div>
        </div>
      </footer>


      {/* Login Modal */}
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>;
}