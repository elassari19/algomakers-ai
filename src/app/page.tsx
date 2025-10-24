import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  Target,
  BarChart3,
  Users,
  Star,
  Check,
  ChevronDown,
  Menu,
  Github,
  Twitter,
  Mail,
  Phone,
  Building2,
  Clock,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { GradientBackground } from '../components/ui/gradient-background';
import { DynamicPricingSection } from '@/components/DynamicPricingSection';
import { AuthNavButtons } from '@/components/AuthNavButtons';
import { HeroAuthButtons } from '@/components/HeroAuthButtons';
import { CTAAuthButton } from '@/components/CTAAuthButton';
import MainHeader from '@/components/main-header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AlgoMakers - Advanced Algorithmic Trading Strategies',
  description: 'Discover and subscribe to proven algorithmic trading strategies. Access backtested trading pairs with real performance metrics, risk analysis, and automated execution.',
  keywords: ['algorithmic trading', 'trading strategies', 'backtested strategies', 'trading algorithms', 'automated trading', 'crypto trading', 'forex trading', 'trading bots', 'quantitative trading', 'AlgoMakers'],
  authors: [{ name: 'AlgoMakers Team' }],
  creator: 'AlgoMakers',
  publisher: 'AlgoMakers',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'AlgoMakers - Advanced Algorithmic Trading Strategies',
    description: 'Discover and subscribe to proven algorithmic trading strategies. Access backtested trading pairs with real performance metrics, risk analysis, and automated execution.',
    url: process.env.NEXTAUTH_URL || 'https://algomakers.ai',
    siteName: 'AlgoMakers',
    images: [
      {
        url: `${process.env.NEXTAUTH_URL || 'https://algomakers.ai'}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'AlgoMakers - Algorithmic Trading Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlgoMakers - Advanced Algorithmic Trading Strategies',
    description: 'Discover and subscribe to proven algorithmic trading strategies. Access backtested trading pairs with real performance metrics.',
    images: [`${process.env.NEXTAUTH_URL || 'https://algomakers.ai'}/og-image.jpg`],
    creator: '@algomakers',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: process.env.NEXTAUTH_URL || 'https://algomakers.ai',
  },
  category: 'finance',
};

export default function Home() {
  return (
    <GradientBackground>
      {/* Navbar */}
      <MainHeader />

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid place-items-center max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
          <div className="text-center space-y-8">
            <Badge variant="outline" className="text-sm py-2">
              <Badge className="mr-2">New</Badge>
              <span>Advanced Trading Algorithms Available!</span>
            </Badge>

            <div className="max-w-screen-md mx-auto text-center text-5xl md:text-6xl font-bold">
              <h1 className="text-white">
                Master Trading with{' '}
                <span className="text-transparent bg-gradient-to-r from-pink-600 to-purple-400 bg-clip-text">
                  AI-Powered
                </span>{' '}
                Algorithms
              </h1>
            </div>

            <p className="max-w-screen-sm mx-auto text-xl text-zinc-400">
              Access professional trading strategies, real-time signals, and
              advanced analytics to maximize your trading performance across
              Forex, Crypto, and Commodities.
            </p>

            <HeroAuthButtons />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
      >
        <h2 className="text-lg text-pink-600 text-center mb-2 tracking-wider font-semibold">
          Features
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold mb-4 text-white">
          What Makes Us Different
        </h2>

        <h3 className="md:w-1/2 mx-auto text-xl text-center text-zinc-400 mb-8">
          Professional-grade trading tools powered by advanced algorithms and
          real-time market analysis to give you the competitive edge.
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: TrendingUp,
              title: 'Real-Time Signals',
              description:
                'Get instant trading signals with precise entry and exit points for maximum profitability.',
            },
            {
              icon: Shield,
              title: 'Risk Management',
              description:
                'Advanced risk assessment tools to protect your capital and minimize potential losses.',
            },
            {
              icon: Zap,
              title: 'Fast Execution',
              description:
                'Lightning-fast signal delivery through TradingView integration for immediate action.',
            },
            {
              icon: Target,
              title: 'High Accuracy',
              description:
                'Proven algorithms with consistently high win rates across multiple market conditions.',
            },
            {
              icon: BarChart3,
              title: 'Advanced Analytics',
              description:
                'Comprehensive performance metrics and detailed analysis of all trading activities.',
            },
            {
              icon: Users,
              title: 'Expert Support',
              description:
                'Access to professional traders and 24/7 customer support for all subscribers.',
            },
          ].map((feature, index) => (
            <div key={index}>
              <Card className="h-full bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
                <CardHeader className="flex justify-center items-center">
                  <div className="bg-gradient-to-br from-pink-600/20 to-purple-400/20 p-3 rounded-full mb-4">
                    <feature.icon className="size-6 text-pink-400" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-zinc-400 text-center">
                  {feature.description}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Pricing Section */}
      <DynamicPricingSection />

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
      >
        <div className="flex flex-col items-center gap-6 text-center mb-16">
          <h2 className="font-urbanist text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Join a Growing <br />
            Team of{' '}
            <span className="bg-gradient-to-r from-pink-600 to-purple-400 bg-clip-text text-transparent">
              Happy Traders
            </span>
          </h2>
          <h3 className="max-w-2xl text-zinc-400 sm:text-xl sm:leading-8">
            See what our customers are saying about our trading strategies and
            signals.
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              id={`col-${index + 1}`}
              key={`col-${index + 1}`}
              className="flex flex-col gap-4 lg:gap-6"
            >
              {[
                // Column 1
                [
                  {
                    title: 'Incredible Trading Results',
                    body: "The AI-powered signals from AlgoMarkers have completely transformed my trading approach. I've seen a 340% increase in my portfolio performance in just 3 months. The accuracy of entry and exit points is simply outstanding.",
                    name: 'Marcus Rodriguez',
                    role: 'Forex Trader at Goldman Sachs',
                  },
                  {
                    title: 'Best Risk Management Tools',
                    body: "As a professional day trader, risk management is everything. AlgoMarkers' advanced algorithms have helped me minimize losses while maximizing gains. The stop-loss recommendations are incredibly precise.",
                    name: 'Sarah Chen',
                    role: 'Day Trader & Fund Manager',
                  },
                  {
                    title: 'Revolutionary Signal Accuracy',
                    body: "I've tried countless trading platforms, but nothing comes close to AlgoMarkers. The signal accuracy is consistently above 85%, and the TradingView integration makes execution seamless. This platform is a game-changer.",
                    name: 'David Kumar',
                    role: 'Crypto Trading Specialist',
                  },
                ],
                // Column 2
                [
                  {
                    title: 'Perfect for Scalping Strategies',
                    body: "The real-time signals are lightning fast and perfect for my scalping strategy. I can execute dozens of profitable trades daily with confidence. The platform's speed and reliability are unmatched in the industry.",
                    name: 'Elena Petrov',
                    role: 'Professional Scalper',
                  },
                  {
                    title: 'Swing Trading Made Easy',
                    body: 'AlgoMarkers has simplified my swing trading approach. The weekly strategy reports and market analysis help me identify the best opportunities. My hit rate has improved from 60% to 82% since joining.',
                    name: 'James Wilson',
                    role: 'Swing Trader & Analyst',
                  },
                  {
                    title: 'Exceptional Commodity Signals',
                    body: "Trading commodities can be complex, but AlgoMarkers makes it straightforward. Their gold and oil signals have been incredibly profitable. I've made more in 6 months than in my previous 2 years of trading.",
                    name: 'Mohammed Al-Rashid',
                    role: 'Commodity Trading Expert',
                  },
                ],
                // Column 3
                [
                  {
                    title: 'Outstanding Customer Support',
                    body: 'Not only are the trading strategies exceptional, but the support team is incredibly knowledgeable. They helped me optimize my risk parameters and trading psychology. Truly a comprehensive trading solution.',
                    name: 'Lisa Thompson',
                    role: 'Portfolio Manager',
                  },
                  {
                    title: 'Professional-Grade Analytics',
                    body: 'The advanced analytics and performance tracking have elevated my trading to the next level. I can analyze every aspect of my trades and continuously improve my strategy. The insights are invaluable.',
                    name: 'Alex Dimitrov',
                    role: 'Quantitative Trader',
                  },
                  {
                    title: 'Life-Changing Platform',
                    body: "AlgoMarkers didn't just improve my trading - it changed my life. I went from struggling trader to consistent profitability. The algorithmic strategies are sophisticated yet easy to follow. I couldn't be happier!",
                    name: 'Rachel Foster',
                    role: 'Independent Trader',
                  },
                ],
              ][index]
                ?.slice(0, 3)
                .map((testimonial) => (
                  <Card
                    key={testimonial.title}
                    className="h-fit bg-gradient-to-r from-pink-600/10 to-purple-400/10 transition-all duration-1000 ease-out hover:opacity-70 md:hover:-translate-y-2 border border-pink-600/20"
                  >
                    <CardHeader>
                      <CardTitle className="font-urbanist text-lg font-semibold tracking-wider text-white">
                        {testimonial.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="leading-6 text-zinc-300 md:text-sm lg:text-base">
                      <blockquote>&quot;{testimonial.body}&quot;</blockquote>
                    </CardContent>
                    <CardFooter className="gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-600 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="flex flex-col gap-[2px]">
                        <p className="text-base font-semibold tracking-wide text-white">
                          {testimonial.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {testimonial.role}
                        </p>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-br from-zinc-900 to-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-20">
          <div className="lg:w-[60%] mx-auto">
            <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm shadow-xl shadow-pink-900/10 border border-pink-600/20 text-center flex flex-col items-center justify-center">
              <CardHeader className="w-full">
                <CardTitle className="text-4xl md:text-5xl font-bold text-white">
                  <TrendingUp className="w-20 h-20 m-auto mb-6 text-pink-400" />
                  <h3 className="flex justify-center gap-2">
                    <span>Ready to start</span>
                    <span className="text-transparent bg-gradient-to-r from-pink-600 to-purple-400 bg-clip-text">
                      Trading?
                    </span>
                  </h3>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl text-zinc-400 mb-8">
                  Join thousands of successful traders who trust AlgoMarkers for
                  their trading success.
                </p>
              </CardContent>
              <CardFooter>
                <CTAAuthButton />
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
      >
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          <div>
            <h2 className="text-lg text-pink-600 mb-2 tracking-wider font-semibold">
              Contact
            </h2>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Get in Touch
            </h2>
            <p className="text-xl text-zinc-400 mb-8">
              Have questions about our trading algorithms? Need help getting
              started? Our team is here to support you.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <div className="flex gap-2 mb-1">
                  <Building2 className="w-5 h-5 text-pink-400" />
                  <div className="font-bold text-white">Find Us</div>
                </div>
                <div className="text-zinc-400">
                  123 Trading Street, Financial District, NY 10004
                </div>
              </div>

              <div>
                <div className="flex gap-2 mb-1">
                  <Phone className="w-5 h-5 text-pink-400" />
                  <div className="font-bold text-white">Call Us</div>
                </div>
                <div className="text-zinc-400">+1 (555) 123-ALGO</div>
              </div>

              <div>
                <div className="flex gap-2 mb-1">
                  <Mail className="w-5 h-5 text-pink-400" />
                  <div className="font-bold text-white">Email Us</div>
                </div>
                <div className="text-zinc-400">support@algomarkers.com</div>
              </div>

              <div>
                <div className="flex gap-2 mb-1">
                  <Clock className="w-5 h-5 text-pink-400" />
                  <div className="font-bold text-white">Support Hours</div>
                </div>
                <div className="text-zinc-400">
                  24/7 for Premium subscribers
                </div>
              </div>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
            <CardHeader>
              <CardTitle className="text-white">Send us a message</CardTitle>
              <CardDescription className="text-zinc-400">
                We'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    First Name
                  </label>
                  <input
                    className="w-full mt-1 px-3 py-2 border border-zinc-600 bg-zinc-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    type="text"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Last Name
                  </label>
                  <input
                    className="w-full mt-1 px-3 py-2 border border-zinc-600 bg-zinc-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    type="text"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300">
                  Email
                </label>
                <input
                  className="w-full mt-1 px-3 py-2 border border-zinc-600 bg-zinc-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300">
                  Message
                </label>
                <textarea className="w-full mt-1 px-3 py-2 border border-zinc-600 bg-zinc-800 text-white rounded-md h-24 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-400 hover:from-pink-700 hover:to-purple-500 text-white">
                Send Message
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="w-full py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col items-center gap-6 text-center mb-16">
            <h2 className="font-urbanist text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Frequently <br /> Asked{' '}
              <span className="bg-gradient-to-r from-pink-600 to-purple-400 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <h3 className="max-w-3xl leading-normal text-zinc-400 sm:text-xl sm:leading-8">
              Find the answers to the most common questions about our trading
              algorithms and platform. Feel free to{' '}
              <Link
                href="#contact"
                className="font-semibold text-white underline-offset-4 transition-all hover:underline"
              >
                email us
              </Link>{' '}
              if you still couldn't find what you were looking for.
            </h3>
          </div>

          <div className="max-w-4xl mx-auto">
            <Accordion
              type="single"
              collapsible
              className="w-full bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-lg shadow-black/20"
            >
              {[
                {
                  question: 'What is AlgoMarkers and how does it work?',
                  answer:
                    'AlgoMarkers is an AI-powered trading platform that provides real-time signals, advanced analytics, and automated strategies for Forex, Crypto, and Commodities trading. Our algorithms analyze market data 24/7 to identify profitable trading opportunities and send you precise entry and exit points through TradingView integration.',
                },
                {
                  question: 'How accurate are your trading signals?',
                  answer:
                    'Our AI algorithms consistently maintain an 85%+ accuracy rate across different market conditions. We track and display real-time performance metrics for all our strategies, including win rates, average returns, and drawdown statistics. Historical performance data is available in your dashboard.',
                },
                {
                  question:
                    'Do I need prior trading experience to use AlgoMarkers?',
                  answer:
                    'No prior experience is required! Our platform is designed for both beginners and professionals. We provide comprehensive educational materials, risk management guides, and 24/7 customer support. The Starter plan includes basic signals and tutorials to help you get started safely.',
                },
                {
                  question: 'What markets and assets do you support?',
                  answer:
                    'We support major Forex pairs (EUR/USD, GBP/USD, USD/JPY, etc.), popular cryptocurrencies (Bitcoin, Ethereum, Altcoins), and key commodities (Gold, Silver, Oil, Natural Gas). The number of trading pairs available depends on your subscription plan, ranging from 5 pairs on the Starter plan to unlimited pairs on Enterprise.',
                },
                {
                  question: 'How do I receive and execute trading signals?',
                  answer:
                    'Signals are delivered in real-time through multiple channels: email notifications, SMS alerts, mobile app push notifications, and direct TradingView integration. Our TradingView plugin allows for one-click trade execution with pre-configured stop-loss and take-profit levels based on our risk management algorithms.',
                },
                {
                  question: 'What kind of customer support do you provide?',
                  answer:
                    'We offer tiered support based on your plan: email support for Starter users, priority support for Professional users, and 24/7 dedicated support for Enterprise clients. Our team includes experienced traders who can help with strategy optimization, risk management, and platform usage. We also provide extensive documentation and video tutorials.',
                },
                {
                  question: 'Is there a free trial or money-back guarantee?',
                  answer:
                    "Yes! We offer a 14-day free trial for the Starter plan, allowing you to test our signals and platform features risk-free. Additionally, we provide a 30-day money-back guarantee for all paid plans if you're not satisfied with the service. No questions asked.",
                },
              ].map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index + 1}`}
                  className="border-zinc-700"
                >
                  <AccordionTrigger className="text-left text-white hover:text-pink-400 text-lg font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-300 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 pb-16 sm:py-32 sm:pb-24">
        <div className="p-10 bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 rounded-2xl shadow-lg shadow-black/20">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
            <div className="col-span-full xl:col-span-2">
              <Link
                href="/"
                className="font-bold text-lg flex items-center text-white"
              >
                <div className="flex aspect-squares w-full items-center justify-center rounded-lg">
                  <img
                    src="/logo.svg"
                    alt="AlgoMakers.AI"
                    className="h-14 w-full"
                  />
                </div>
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-lg text-white">Product</h3>
              <Link
                href="#features"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/dashboard"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                Dashboard
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-lg text-white">Support</h3>
              <Link
                href="#contact"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="#"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="#"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                Documentation
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-lg text-white">Company</h3>
              <Link
                href="#"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                About
              </Link>
              <Link
                href="#"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                Blog
              </Link>
              <Link
                href="#"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                Careers
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-lg text-white">Social</h3>
              <Link
                href="#"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                Twitter
              </Link>
              <Link
                href="#"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                LinkedIn
              </Link>
              <Link
                href="#"
                className="text-zinc-400 hover:text-pink-400 transition-colors"
              >
                Discord
              </Link>
            </div>
          </div>

          <Separator className="my-6 bg-zinc-700" />
          <section>
            <h3 className="text-center text-sm text-zinc-400">
              &copy; 2024 AlgoMarkers. All rights reserved.
            </h3>
          </section>
        </div>
      </footer>
    </GradientBackground>
  );
}

