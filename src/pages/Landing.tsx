import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginModal } from '@/components/LoginModal';
import { Play, Clock, Globe, Shield, BarChart3, Accessibility, Sparkles } from 'lucide-react';
import shannonPhoto from '@/assets/shannon-seaver.jpg';
import jenaPhoto from '@/assets/jena-zangs.jpg';

// Video player component for back-to-back videos
function GettingStartedVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videos = [
    '/videos/getting-started-1.mp4',
    '/videos/getting-started-2.mp4'
  ];

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

  return (
    <div className="aspect-video bg-foreground relative">
      <video
        ref={videoRef}
        src={videos[currentVideo]}
        onEnded={handleVideoEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full object-cover"
        controls
        playsInline
      />
      {!isPlaying && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
        >
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-secondary ml-1" fill="currentColor" />
          </div>
        </button>
      )}
      <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
        {currentVideo + 1} / {videos.length}
      </div>
    </div>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
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
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 opacity-40">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/30 blur-[100px] animate-pulse" style={{ top: '20%', left: '80%', animationDuration: '8s' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-secondary/30 blur-[100px] animate-pulse" style={{ top: '80%', left: '20%', animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-accent/30 blur-[100px] animate-pulse" style={{ top: '40%', left: '40%', animationDuration: '12s', animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="#" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform -rotate-3">
              R
            </div>
            <span className="font-display text-xl font-bold text-primary">
              Let's Get <span className="text-accent">REAL</span>
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-foreground/80 hover:text-primary transition-colors font-medium">Features</button>
            <button onClick={() => scrollToSection('why')} className="text-foreground/80 hover:text-primary transition-colors font-medium">Why Us</button>
            <button onClick={() => scrollToSection('videos')} className="text-foreground/80 hover:text-primary transition-colors font-medium">Videos</button>
            <button onClick={() => scrollToSection('team')} className="text-foreground/80 hover:text-primary transition-colors font-medium">Team</button>
            <button
              onClick={() => setLoginOpen(true)}
              className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-accent/20 to-primary/20 text-accent px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-pulse">
              <Sparkles className="w-4 h-4" />
              Built at Lovable SheBuilds 48-Hour Buildathon 2025
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-primary">Let's Get REAL</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground font-medium mb-2">
              <span className="text-primary">R</span>esponsive. <span className="text-primary">E</span>quitable. <span className="text-primary">A</span>daptive. <span className="text-primary">L</span>earner.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Differentiated lessons and authentic assessments generated in 60 seconds. Because every student deserves learning that fits them.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <button
                onClick={() => scrollToSection('features')}
                className="px-6 py-3 border-2 border-foreground text-foreground rounded-full font-semibold hover:bg-foreground hover:text-background transition-all"
              >
                See How It Works
              </button>
              <button
                onClick={() => scrollToSection('videos')}
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-full font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Watch Demo
              </button>
            </div>
            <div className="flex gap-8 md:gap-12 pt-6 border-t border-border/50">
              <div>
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">60s</div>
                <div className="text-sm text-muted-foreground">Lesson Generation</div>
              </div>
              <div>
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">12+</div>
                <div className="text-sm text-muted-foreground">Languages</div>
              </div>
              <div>
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Authentic Assessments</div>
              </div>
            </div>
          </div>

          {/* Hero Login Card */}
          <div className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="h-1.5 bg-gradient-to-r from-secondary via-primary to-accent rounded-full -mt-8 mx-[-32px] mb-8" style={{ marginTop: '-32px', marginLeft: '-32px', marginRight: '-32px', borderRadius: '24px 24px 0 0' }} />
            <h2 className="font-display text-2xl font-bold text-primary mb-2">Welcome Back</h2>
            <p className="text-muted-foreground mb-6">Sign in to access your classroom</p>
            
            <div className="space-y-3 mb-4">
              <button
                onClick={() => setLoginOpen(true)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-background border-2 border-border rounded-xl font-medium hover:bg-muted transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
              <button
                onClick={() => setLoginOpen(true)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-background border-2 border-border rounded-xl font-medium hover:bg-muted transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                Continue with Microsoft
              </button>
            </div>

            <button
              onClick={() => setLoginOpen(true)}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Sign In with Email
            </button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              New here?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 md:px-8 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-accent font-bold uppercase tracking-widest text-sm mb-4 block">What We Do</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Transform Your Classroom in Minutes
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Our platform creates differentiated, accessible, and authentic learning experiences tailored to your unique classroom needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Clock, color: 'bg-accent', title: '60-Second Lessons', desc: 'Input your topic and class profile. Get complete, differentiated lesson packages instantly—no more hours of prep work.' },
              { icon: Shield, color: 'bg-white/20', title: 'Smart Differentiation', desc: 'Automatically generates multiple reading levels, visual supports, and IEP accommodations for every learner in your room.' },
              { icon: Globe, color: 'bg-accent', title: '12+ Languages', desc: 'Multilingual audio and translations for ELL students. Support for Spanish, Hmong, Somali, and more built right in.' },
              { icon: Sparkles, color: 'bg-white/20', title: 'Authentic Assessments', desc: 'Authentic assessments that require real thinking—process checkpoints, artifacts, and reflection.' },
              { icon: BarChart3, color: 'bg-accent', title: 'Real-Time Analytics', desc: 'Track engagement, identify struggling students, and see exactly where your class needs support—instantly.' },
              { icon: Accessibility, color: 'bg-white/20', title: 'Accessibility First', desc: 'WCAG 2.1 AA compliant. Text-to-speech, dyslexia fonts, keyboard navigation, and extended time—all built in.' },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:-translate-y-2 hover:border-transparent transition-all duration-300 group"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section id="why" className="py-24 px-4 md:px-8 bg-gradient-to-b from-background to-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent font-bold uppercase tracking-widest text-sm mb-4 block">The Problem We Solve</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why We Built This
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              American classrooms are more diverse than ever, but traditional teaching tools are failing our students.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {[
                { icon: '⏰', title: 'Differentiation is a Time Burden', desc: 'Teachers spend 10+ hours weekly creating modified materials', bg: 'bg-red-100' },
                { icon: '📋', title: 'IEP Accommodations Are Manual', desc: 'Every modification requires custom work from already-stretched teachers', bg: 'bg-amber-100' },
                { icon: '🌐', title: 'Translation Support is Costly', desc: '10.4 million ELL students often lack materials in their home language', bg: 'bg-blue-100' },
                { icon: '🤖', title: 'AI Broke Traditional Assessment', desc: 'Students can ChatGPT their way through homework—we need new approaches', bg: 'bg-purple-100' },
              ].map((problem, i) => (
                <div key={i} className="bg-card rounded-2xl p-6 shadow-lg flex items-center gap-5 hover:translate-x-2 transition-transform">
                  <div className={`w-14 h-14 ${problem.bg} rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                    {problem.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{problem.title}</h4>
                    <p className="text-sm text-muted-foreground">{problem.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                Our Solution: Authentic Learning That Works
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                We're educators who've lived these problems. We built Authentic Learning Studio because we know what teachers actually need—not another complicated platform, but a tool that genuinely saves time while serving every student.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Class-specific differentiation that actually fits your students',
                  'Multilingual audio generated automatically',
                  'Assessments that prove real understanding',
                  'Built by teachers, for teachers',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-bold shrink-0">✓</span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            <button
              onClick={() => setLoginOpen(true)}
              className="px-8 py-3 bg-primary text-white rounded-full font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Try It Free
            </button>
            </div>
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <section id="videos" className="py-24 px-4 md:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent font-bold uppercase tracking-widest text-sm mb-4 block">See It In Action</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Watch How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See exactly how Authentic Learning Studio transforms classroom prep and student engagement.
            </p>
          </div>

          {/* Getting Started Video Player - with two videos back to back */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-background rounded-2xl overflow-hidden shadow-xl">
              <GettingStartedVideoPlayer />
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-foreground mb-2">Getting Started in 60 Seconds</h3>
                <p className="text-muted-foreground text-sm">Watch how quickly you can generate a complete differentiated lesson package.</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { title: 'Authentic Assessments Explained', desc: 'Learn how our authentic assessments ensure real learning, not AI shortcuts.', duration: '5:12' },
              { title: 'Multilingual Support Demo', desc: 'See how we support 12+ languages with automatic audio generation.', duration: '4:08' },
              { title: 'Our Story: Why We Built This', desc: 'Hear from Shannon and Jena about the mission behind Authentic Learning.', duration: '6:45' },
            ].map((video, i) => (
              <div key={i} className="bg-background rounded-2xl overflow-hidden shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all">
                <div className="aspect-video bg-gradient-to-br from-foreground to-foreground/80 relative flex items-center justify-center">
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute w-full h-full bg-gradient-to-br from-secondary/50 to-primary/50" />
                  </div>
                  <button className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-secondary hover:text-white transition-all group z-10">
                    <Play className="w-6 h-6 text-secondary group-hover:text-white ml-1" fill="currentColor" />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">{video.title}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{video.desc}</p>
                  <span className="inline-flex items-center gap-2 text-secondary font-semibold text-sm">
                    🎬 {video.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hackathon Section */}
      <section className="py-24 px-4 md:px-8 bg-gradient-to-br from-foreground to-foreground/90 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute w-[500px] h-[500px] bg-accent rounded-full blur-[150px]" style={{ top: '10%', left: '90%' }} />
          <div className="absolute w-[500px] h-[500px] bg-secondary rounded-full blur-[150px]" style={{ top: '90%', left: '10%' }} />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-5 py-2.5 rounded-full mb-8">
            <span>🚀</span>
            <span className="text-white font-semibold">Built with Lovable.dev</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Created at the{' '}
            <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              She Builds Hackathon
            </span>
          </h2>
          <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            In December 2024, two educators set out to solve the differentiation crisis in American classrooms. 48 hours of livestreamed coding, building in public, and pure determination brought Authentic Learning Studio to life.
          </p>
          
          <div className="flex justify-center gap-8 md:gap-16 mb-10">
            {[
              { num: '48', label: 'Hours of Building' },
              { num: '2', label: 'Passionate Educators' },
              { num: '1', label: 'Mission-Driven Platform' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                  {stat.num}
                </div>
                <div className="text-white/70 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <a
            href="https://lovable.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-accent to-accent/80 text-foreground rounded-full font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Learn About Lovable →
          </a>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent font-bold uppercase tracking-widest text-sm mb-4 block">Meet the Founders</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              REALLY Made by Educators
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We've been in the classroom. We know the struggle. That's why we built something that actually works.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              {
                name: 'Shannon Seaver',
                role: 'Founder & CEO',
                bio: 'Tekne Award-winning National Board Certified Teacher with 15+ years in the classroom. Master\'s in Mathematics from Bemidji State University. Building the future of differentiated learning.',
                email: 'shannon@creatempls.org',
                image: shannonPhoto,
              },
              {
                name: 'Jena Zangs',
                role: 'Co-Founder & Data Lead',
                bio: 'Chief Data & Analytics Officer at University of St. Thomas. Women in AI Minnesota Ambassador. Bringing data science expertise to transform educational outcomes.',
                email: '',
                image: jenaPhoto,
              },
            ].map((member, i) => (
              <div key={i} className="bg-card rounded-3xl overflow-hidden shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all">
                <div className="aspect-square bg-gradient-to-br from-accent/50 to-primary/50 relative flex items-center justify-center">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-4/5 h-4/5 bg-white/20 rounded-2xl border-2 border-dashed border-white/40 flex flex-col items-center justify-center text-white">
                      <span className="text-5xl mb-2">📸</span>
                      <span className="text-sm opacity-80">{member.name.split(' ')[0]}'s Photo</span>
                    </div>
                  )}
                </div>
                <div className="p-8 text-center">
                  <h3 className="font-display text-2xl font-bold text-foreground mb-1">{member.name}</h3>
                  <p className="text-secondary font-semibold mb-4">{member.role}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">{member.bio}</p>
                  <div className="flex justify-center gap-3">
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-foreground hover:bg-secondary hover:text-white transition-colors">
                      in
                    </a>
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-foreground hover:bg-secondary hover:text-white transition-colors">
                        ✉
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 md:px-8 bg-gradient-to-br from-secondary to-secondary/90 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to Transform Your Classroom?
          </h2>
          <p className="text-white/90 text-lg md:text-xl mb-8 max-w-xl mx-auto">
            Join educators who are saving hours every week while better serving every student in their room.
          </p>
          <button
            onClick={() => setLoginOpen(true)}
            className="px-10 py-4 bg-white text-secondary rounded-full font-bold text-lg shadow-xl hover:bg-foreground hover:text-white hover:-translate-y-1 transition-all"
          >
            Get Started Free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-8 bg-foreground text-white/70">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <span className="font-display text-lg text-white">Authentic Learning Studio</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollToSection('videos')} className="hover:text-white transition-colors">Videos</button>
            <button onClick={() => scrollToSection('team')} className="hover:text-white transition-colors">Team</button>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <div className="text-center md:text-right">
            <p>Questions? Reach out!</p>
            <a href="mailto:shannon@creatempls.org" className="text-secondary hover:underline">shannon@creatempls.org</a>
            <p className="mt-1">952-412-9686</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
