import { 
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const documentation = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of TokenIQ X and set up your first treasury.',
    icon: BookOpenIcon,
    link: '#',
  },
  {
    title: 'Asset Tokenization',
    description: 'Guide to tokenizing real-world assets on the platform.',
    icon: QuestionMarkCircleIcon,
    link: '#',
  },
  {
    title: 'AI Strategies',
    description: 'Understanding how our AI-powered investment strategies work.',
    icon: VideoCameraIcon,
    link: '#',
  },
  {
    title: 'FAQs',
    description: 'Common questions and answers about the platform.',
    icon: ChatBubbleLeftRightIcon,
    link: '#',
  },
];

export default function HelpPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Help & Support</h1>
        <p className="text-gray-400">Documentation and resources to help you get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentation.map((doc) => (
          <Card
            key={doc.title}
            title={doc.title}
            icon={<doc.icon className="w-6 h-6 text-primary-500" />}
          >
            <p className="text-gray-300 mb-4">{doc.description}</p>
            <Button variant="outline" className="w-full justify-center">
              Read More
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Need Additional Help?
            </h2>
            <p className="text-gray-300 mb-6">
              Our support team is available 24/7 to assist you with any questions or concerns.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                leftIcon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
              >
                Live Chat
              </Button>
              <Button>
                Submit Ticket
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpenIcon className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Documentation</h3>
            <p className="text-gray-300 mb-4">
              Comprehensive guides and API references
            </p>
            <Button variant="ghost" className="w-full justify-center">
              View Docs
            </Button>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <VideoCameraIcon className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Video Tutorials</h3>
            <p className="text-gray-300 mb-4">
              Step-by-step guides in video format
            </p>
            <Button variant="ghost" className="w-full justify-center">
              Watch Now
            </Button>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
            <p className="text-gray-300 mb-4">
              Join our Discord for community support
            </p>
            <Button variant="ghost" className="w-full justify-center">
              Join Discord
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
} 