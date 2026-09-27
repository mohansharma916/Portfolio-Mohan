import Image from 'next/image';
import { ChevronRight, Link } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ProjectProps {
  title: string;
  description?: string;
  techStack?: string[];
  date?: string;
  links?: { name: string; url: string }[];
  images?: { src: string; alt: string }[];
}

// Project content based on Mohan Sharma's resume
const PROJECT_CONTENT: ProjectProps[] = [
  {
    title: 'FutureClo: Virtual Try Ons',
    description:
      "The Virtual Trial Mirror is an innovative application designed to enhance the online shopping experience for customers. Utilizing the advanced capabilities of Snapchat's Lens Studio, the project creates a virtual mirror that allows users to try on clothes virtually. By integrating this technology into online retail platforms, customers can see how different outfits look on them without physically trying them on.",
    techStack: [
      'React JS',
      'Tailwind CSS',
      'REST API',
      'NestJS',
      'MongoDB',
      'AWS S3',
      'AWS SES',
      'AWS Secret Manager',
      'Cookie Based Authentication',
      'Passport.js',
      'Passport-JWT'
    ],
    date: '2024-2025',
    links: [],
    images: [],
  },
  {
    title: 'KYC Platform',
    description:
      'A comprehensive KYC platform with document verification and a companion mobile application. The platform provides a user-friendly interface for web and mobile users, with secure document upload, transaction verification, and admin workflows for reviewing and approving submitted documents.',
    techStack: [
      'NestJS',
      'GraphQL',
      'Prisma',
      'PostgreSQL',
      'Next.js',
      'Nginx',
      'React Native'
    ],
    date: '2022-2024',
    links: [],
    images: [],
  },
  {
    title: 'Scratch & Reveal Cashback System',
    description:
      'A web and mobile application for an interactive Scratch and Reveal cashback system for a spice brand. The solution includes secure code validation, reward processing, cashback crediting, and backend API integration to provide a seamless experience across web and mobile platforms.',
    techStack: [
      'NestJS',
      'GraphQL',
      'Prisma',
      'PostgreSQL',
      'Next.js',
      'Nginx',
      'React Native'
    ],
    date: '2022-2024',
    links: [],
    images: [],
  },
];

const ProjectContent = ({ project }: { project: ProjectProps }) => {
  // Find the matching project data
  const projectData = PROJECT_CONTENT.find((p) => p.title === project.title);

  if (!projectData) {
    return <div>Project details not available</div>;
  }

  return (
    <div className="space-y-10">
      {/* Header section with description */}
      <div className="rounded-3xl bg-[#F5F5F7] p-8 dark:bg-[#1D1D1F]">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span>{projectData.date}</span>
          </div>

          <p className="text-secondary-foreground font-sans text-base leading-relaxed md:text-lg">
            {projectData.description}
          </p>

          {/* Tech stack */}
          <div className="pt-4">
            <h3 className="mb-3 text-sm tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              Technologies
            </h3>
            <div className="flex flex-wrap gap-2">
              {projectData.techStack?.map((tech, index) => (
                <span
                  key={index}
                  className="rounded-full bg-neutral-200 px-3 py-1 text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Links section */}
      {projectData.links && projectData.links.length > 0 && (
        <div className="mb-24">
          <div className="px-6 mb-4 flex items-center gap-2">
            <h3 className="text-sm tracking-wide text-neutral-500 dark:text-neutral-400">
              Links
            </h3>
            <Link className="text-muted-foreground w-4" />
          </div>
          <Separator className="my-4" />
          <div className="space-y-3">
            {projectData.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#F5F5F7] flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-[#E5E5E7] dark:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                <span className="font-light capitalize">{link.name}</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Images gallery */}
      {projectData.images && projectData.images.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {projectData.images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-video overflow-hidden rounded-2xl"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main data export with project content from resume
export const data = [
  {
    category: 'AI / E-Commerce',
    title: 'FutureClo: Virtual Try Ons',
    src: '/futureclo-preview.png',
    content: <ProjectContent project={{ title: 'FutureClo: Virtual Try Ons' }} />,
  },
  {
    category: 'FinTech / KYC',
    title: 'KYC Platform',
    src: '/kyc-preview.png',
    content: <ProjectContent project={{ title: 'KYC Platform' }} />,
  },
  {
    category: 'Web & Mobile',
    title: 'Scratch & Reveal Cashback System',
    src: '/scratch-reveal-preview.png',
    content: (
      <ProjectContent project={{ title: 'Scratch & Reveal Cashback System' }} />
    ),
  },
];
