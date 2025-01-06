import { EnvelopeIcon } from '@heroicons/react/24/outline';
import EmailInput from '@/components/ui/emailInput';

const SignupHero = () => {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
        <div className="mr-auto place-self-center lg:col-span-7">
          <h1 className="text-5xl font-bold dark:text-white">
            Transform, Convert & Manage Images with Ease
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Convert images to any format, resize in bulk, generate photo reports, and organize your projects. The all-in-one tool that makes image processing effortless.
          </p>
          <form className="mt-8 mx-auto">
            <div className="flex flex-row gap-4">
              <div className="flex-1">
                <EmailInput
                placeholder="Enter your email"
                icon={<EnvelopeIcon className="w-5 h-5" />}
                  />
                </div>
              
              <button 
                type="submit"
                className="btn-primary"
              >
                Try for free
              </button>
            </div>
            
              <div className="mt-4 text-sm font-light text-gray-500 dark:text-gray-400">
                Instant signup. No credit card required.{" "}
                <a href="#" className="font-medium text-primary-600 dark:text-primary-500">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-medium text-primary-600 dark:text-primary-500">
                  Privacy Policy
                </a>
                .
              </div>
          </form>
        </div>

        <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
          <img
            src="/images/signup-hero-image.png"
            alt="PicTool illustration showcasing various image processing and conversion features"
          />
        </div>
      </div>
    </section>
  );
};

export default SignupHero;
