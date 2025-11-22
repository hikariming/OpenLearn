import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between p-6 border-b">
        <div className="text-2xl font-bold text-gray-900">OpenLearn</div>
        <div className="space-x-4">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6">
          Master New Skills <br />
          <span className="text-blue-600">With AI-Powered Learning</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          OpenLearn provides a personalized learning experience tailored to your goals.
          Join thousands of learners today.
        </p>
        <div className="space-x-4">
          <Link href="/register">
            <Button size="lg" className="px-8 text-lg">Start Learning Now</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="px-8 text-lg">Log In</Button>
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-500 border-t">
        © {new Date().getFullYear()} OpenLearn. All rights reserved.
      </footer>
    </div>
  );
}
