import { Link } from '@/components/ui/link'
import {
  ArrowRight,
  Bot,
  GitBranch,
  ListTodo,
  MessageSquare,
  Network,
  Plug,
  Rocket,
  Server,
  Target,
  UserPlus,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeInOnScroll } from '@/components/marketing/fade-in'
import { CurrentYear } from '@/components/marketing/current-year'
import { OpenChatButton } from '@/components/marketing/open-chat-button'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lead high-performing teams | mpath',
  description:
    'mpath gives managers a unified operating system for clarity, coaching, and continuous improvement across their teams.',
}

export default async function MarketingHome() {
  return (
    <>
      {/* Hero Section */}
      <section className='mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 pb-20 pt-6 text-center sm:px-8 md:pt-24'>
        <FadeInOnScroll>
          <span className='inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60'>
            MANAGEMENT, ELEVATED
          </span>
        </FadeInOnScroll>
        <FadeInOnScroll delay={100}>
          <h1 className='text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl'>
            Give your teams clarity, coaching, and momentum in one operating
            system.
          </h1>
        </FadeInOnScroll>
        <FadeInOnScroll delay={200}>
          <p className='mx-auto max-w-4xl text-base text-white/70 sm:text-lg'>
            mpath brings planning, 1:1s, feedback, and delivery signals together
            so managers can lead with confidence—not spreadsheets. Stay aligned,
            move faster, and grow people without losing sight of execution.
          </p>
        </FadeInOnScroll>
        <FadeInOnScroll delay={300}>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <Button
              asChild
              size='lg'
              className='bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(79,70,229,0.45)] transition-all duration-200 hover:-translate-y-0.5'
            >
              <Link href='/auth/signup' className='flex items-center gap-2'>
                Start building your rhythm
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
            <Button
              asChild
              size='lg'
              variant='outline'
              className='border-white/20 bg-white/5 text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:text-white'
            >
              <Link href='/pricing'>View pricing</Link>
            </Button>
          </div>
        </FadeInOnScroll>
        <FadeInOnScroll delay={400}>
          <nav className='flex flex-wrap items-center justify-center gap-6 text-sm text-white/70'>
            <Link
              href='#people-teams'
              className='transition-colors hover:text-white'
            >
              People & Teams
            </Link>
            <Link
              href='#work-tracking'
              className='transition-colors hover:text-white'
            >
              Work Tracking
            </Link>
            <Link href='#ai' className='transition-colors hover:text-white'>
              AI
            </Link>
            <Link
              href='#integrations'
              className='transition-colors hover:text-white'
            >
              Integrations
            </Link>
          </nav>
        </FadeInOnScroll>
      </section>

      {/* People & Teams Section */}
      <section
        id='people-teams'
        className='mx-auto max-w-6xl px-6 pb-24 sm:px-8'
      >
        <FadeInOnScroll className='rounded-3xl border border-white/5 bg-white/[0.03] p-10 shadow-[0_25px_60px_rgba(7,16,29,0.45)] backdrop-blur'>
          <div className='space-y-8'>
            <div className='text-center'>
              <p className='text-sm font-semibold uppercase tracking-[0.3em] text-white/60'>
                People & Teams
              </p>
              <h2 className='mt-4 text-3xl font-semibold text-white sm:text-4xl'>
                Manage people and teams with clarity.
              </h2>
              <p className='mx-auto mt-4 text-base text-white/70'>
                mpath understands that organizations are complex. Your team
                structures don&apos;t always match your reporting lines, and
                that&apos;s okay. We help you manage both.
              </p>
            </div>

            <div className='grid gap-6 md:grid-cols-3'>
              <FadeInOnScroll
                delay={100}
                className='rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left transition-colors duration-300 hover:border-white/30'
              >
                <Network className='mb-4 h-8 w-8 text-indigo-400' />
                <h3 className='text-lg font-semibold text-white'>
                  Organization vs. People Hierarchies
                </h3>
                <p className='mt-2 text-sm text-white/70'>
                  Teams represent how work gets done—cross-functional squads,
                  project teams, or working groups. People hierarchies show
                  reporting relationships. mpath keeps both structures clear so
                  you can see the full picture of how your organization
                  operates.
                </p>
              </FadeInOnScroll>

              <FadeInOnScroll
                delay={200}
                className='rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left transition-colors duration-300 hover:border-white/30'
              >
                <MessageSquare className='mb-4 h-8 w-8 text-emerald-400' />
                <h3 className='text-lg font-semibold text-white'>
                  360° Feedback
                </h3>
                <p className='mt-2 text-sm text-white/70'>
                  Collect rich, multi-perspective feedback through feedback
                  campaigns. Get input from peers, direct reports, and
                  collaborators. Track feedback over time to identify growth
                  patterns and celebrate progress. Private or public—you control
                  the visibility.
                </p>
              </FadeInOnScroll>

              <FadeInOnScroll
                delay={300}
                className='rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left transition-colors duration-300 hover:border-white/30'
              >
                <UserPlus className='mb-4 h-8 w-8 text-amber-400' />
                <h3 className='text-lg font-semibold text-white'>
                  Formalized Onboarding
                </h3>
                <p className='mt-2 text-sm text-white/70'>
                  Create onboarding templates with structured tasks and
                  milestones. When new team members join, launch their
                  personalized onboarding journey with clear expectations.
                  Managers stay informed on progress while new hires ramp up
                  confidently.
                </p>
              </FadeInOnScroll>
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      {/* Work Tracking Section */}
      <section
        id='work-tracking'
        className='mx-auto max-w-6xl px-6 pb-24 sm:px-8'
      >
        <FadeInOnScroll className='rounded-3xl border border-white/5 bg-white/[0.03] p-10 shadow-[0_25px_60px_rgba(7,16,29,0.45)] backdrop-blur'>
          <div className='space-y-8'>
            <div className='text-center'>
              <p className='text-sm font-semibold uppercase tracking-[0.3em] text-white/60'>
                Work Tracking
              </p>
              <h2 className='mt-4 text-3xl font-semibold text-white sm:text-4xl'>
                Track work at every level.
              </h2>
              <p className='mx-auto mt-4 text-base text-white/70'>
                From strategic initiatives that span quarters to daily tasks
                that need to get done—mpath gives you the right tool for each
                level of work.
              </p>
            </div>

            <div className='grid gap-8 md:grid-cols-2'>
              <FadeInOnScroll
                delay={100}
                className='rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-400/10 via-indigo-500/10 to-transparent p-6 text-left shadow-[0_18px_50px_rgba(79,70,229,0.2)]'
              >
                <Rocket className='mb-4 h-10 w-10 text-indigo-400' />
                <h3 className='text-xl font-semibold text-white'>
                  Initiatives
                </h3>
                <p className='mt-3 text-white/70'>
                  Some of the most important work doesn&apos;t fit neatly into
                  tickets. Initiatives represent large-scale efforts that span
                  teams, quarters, or even years—things like &quot;Improve
                  Customer Experience&quot;, &quot;Launch New Market&quot;, or
                  &quot;Operational Excellence&quot;.
                </p>
                <ul className='mt-4 space-y-2 text-sm text-white/70'>
                  <li className='flex items-start gap-2'>
                    <Target className='mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400' />
                    <span>
                      Define objectives that explain the why behind the work
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <Users className='mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400' />
                    <span>
                      Connect people to the initiatives they&apos;re involved in
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <GitBranch className='mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400' />
                    <span>
                      Track progress and keep stakeholders aligned over time
                    </span>
                  </li>
                </ul>
              </FadeInOnScroll>

              <FadeInOnScroll
                delay={200}
                className='rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 via-emerald-500/10 to-transparent p-6 text-left shadow-[0_18px_50px_rgba(6,95,70,0.2)]'
              >
                <ListTodo className='mb-4 h-10 w-10 text-emerald-400' />
                <h3 className='text-xl font-semibold text-white'>Tasks</h3>
                <p className='mt-3 text-white/70'>
                  For day-to-day work, tasks keep things moving. Create them
                  from anywhere in mpath with a quick keyboard shortcut. Assign
                  ownership, set priorities, and link them back to the
                  initiatives they support.
                </p>
                <ul className='mt-4 space-y-2 text-sm text-white/70'>
                  <li className='flex items-start gap-2'>
                    <ArrowRight className='mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400' />
                    <span>
                      Press Q from anywhere to create a task instantly
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <ArrowRight className='mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400' />
                    <span>Link tasks to initiatives and objectives</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <ArrowRight className='mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400' />
                    <span>
                      Track ownership, status, and priorities at a glance
                    </span>
                  </li>
                </ul>
              </FadeInOnScroll>
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      {/* AI Section */}
      <section id='ai' className='mx-auto max-w-6xl px-6 pb-24 sm:px-8'>
        <FadeInOnScroll className='rounded-3xl border border-white/5 bg-white/[0.03] p-10 shadow-[0_25px_60px_rgba(7,16,29,0.45)] backdrop-blur'>
          <div className='space-y-8'>
            <div className='text-center'>
              <p className='text-sm font-semibold uppercase tracking-[0.3em] text-white/60'>
                AI-Powered
              </p>
              <h2 className='mt-4 text-3xl font-semibold text-white sm:text-4xl'>
                Your intelligent management assistant.
              </h2>
              <p className='mx-auto mt-4 text-base text-white/70'>
                mpath isn&apos;t just a tool—it&apos;s a partner. Ask questions,
                get insights, and let AI help you understand your team and work
                better.
              </p>
            </div>

            <div className='grid gap-6 md:grid-cols-2'>
              <FadeInOnScroll
                delay={100}
                className='rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-400/10 via-purple-500/10 to-transparent p-6 text-left shadow-[0_18px_50px_rgba(147,51,234,0.2)]'
              >
                <Bot className='mb-4 h-10 w-10 text-purple-400' />
                <h3 className='text-xl font-semibold text-white'>
                  Chat with mpath
                </h3>
                <p className='mt-3 text-white/70'>
                  Have a conversation with mpath about your people, initiatives,
                  tasks, and feedback. Ask about someone&apos;s recent
                  contributions, get a summary of an initiative&apos;s progress,
                  or prepare for your next 1:1 with context at your fingertips.
                </p>
                <p className='mt-3 text-sm text-purple-300/80'>
                  &quot;What has Sarah been working on this quarter?&quot;
                  <br />
                  &quot;Summarize the Customer Experience initiative.&quot;
                  <br />
                  &quot;Help me prepare for my 1:1 with James.&quot;
                </p>
              </FadeInOnScroll>

              <FadeInOnScroll
                delay={200}
                className='rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-cyan-500/10 to-transparent p-6 text-left shadow-[0_18px_50px_rgba(6,182,212,0.2)]'
              >
                <Server className='mb-4 h-10 w-10 text-cyan-400' />
                <h3 className='text-xl font-semibold text-white'>MCP Server</h3>
                <p className='mt-3 text-white/70'>
                  mpath can act as an MCP (Model Context Protocol) server,
                  allowing your AI tools to access your management data
                  securely. Connect Claude, Cursor, or other MCP-compatible
                  tools to get mpath context right where you work.
                </p>
                <p className='mt-3 text-sm text-cyan-300/80'>
                  Query your team data from AI-powered tools. Get initiative
                  context in your workflow. Let your AI assistant understand
                  your organizational context.
                </p>
              </FadeInOnScroll>
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      {/* Integrations Section */}
      <section
        id='integrations'
        className='mx-auto max-w-6xl px-6 pb-24 sm:px-8'
      >
        <FadeInOnScroll className='rounded-3xl border border-white/5 bg-white/[0.03] p-10 shadow-[0_25px_60px_rgba(7,16,29,0.45)] backdrop-blur'>
          <div className='space-y-8'>
            <div className='text-center'>
              <p className='text-sm font-semibold uppercase tracking-[0.3em] text-white/60'>
                Integrations
              </p>
              <h2 className='mt-4 text-3xl font-semibold text-white sm:text-4xl'>
                Connect to where work happens.
              </h2>
              <p className='mx-auto mt-4 text-base text-white/70'>
                mpath integrates with the tools your team already uses. Pull in
                activity data to understand what people are working on and
                provide richer context for feedback and overviews.
              </p>
            </div>

            <div className='flex flex-col items-center gap-6 md:flex-row md:justify-center'>
              <FadeInOnScroll
                delay={100}
                className='flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-white/30'
              >
                <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/20'>
                  <Plug className='h-6 w-6 text-blue-400' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-white'>Jira</h3>
                  <p className='mt-1 text-sm text-white/70'>
                    See what tickets people are working on, understand their
                    workload, and get context for performance conversations.
                  </p>
                </div>
              </FadeInOnScroll>

              <FadeInOnScroll
                delay={200}
                className='flex w-full items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-white/30'
              >
                <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-500/20'>
                  <GitBranch className='h-6 w-6 text-gray-400' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-white'>GitHub</h3>
                  <p className='mt-1 text-sm text-white/70'>
                    Track contributions, pull requests, and code activity. Get a
                    complete picture of team activity for technical teams.
                  </p>
                </div>
              </FadeInOnScroll>
            </div>

            <div className='text-center'>
              <p className='text-sm text-white/50'>
                More integrations coming soon—Slack, Linear, and more.
              </p>
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      {/* CTA Section */}
      <section id='cta' className='mx-auto max-w-4xl px-6 pb-24 sm:px-8'>
        <FadeInOnScroll className='relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-10 text-center shadow-[0_28px_70px_rgba(7,16,29,0.55)] backdrop-blur'>
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_rgba(255,255,255,0))]' />
          <div className='relative space-y-6'>
            <p className='text-sm font-semibold uppercase tracking-[0.35em] text-white/60'>
              Ready when you are
            </p>
            <h2 className='text-3xl font-semibold text-white sm:text-4xl'>
              Bring harmony to how your teams deliver.
            </h2>
            <p className='mx-auto max-w-4xl text-base text-white/70'>
              Get started with mpath today. Invite your leads, connect your
              rituals, and see how a shared operating system transforms the way
              you support your team.
            </p>
            <div className='flex flex-wrap items-center justify-center gap-4'>
              <Button
                asChild
                size='lg'
                className='bg-white text-black shadow-[0_18px_40px_rgba(148,163,255,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90'
              >
                <Link href='/auth/signup' className='flex items-center gap-2'>
                  Get started
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
              <OpenChatButton className='border-white/20 bg-white/10 text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:text-white'>
                Talk with us
              </OpenChatButton>
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      <footer className='border-t border-white/10 bg-black/20'>
        <div className='mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-white/50 sm:flex-row sm:px-8'>
          <p>
            © <CurrentYear /> mpath. Designed for team leaders.
          </p>
          <div className='flex items-center gap-6'>
            <Link
              href='/auth/signup'
              className='transition-colors hover:text-white'
            >
              Register
            </Link>
            <Link
              href='/auth/signin'
              className='transition-colors hover:text-white'
            >
              Sign in
            </Link>
            <Link
              href='mailto:hello@manageros.com'
              className='transition-colors hover:text-white'
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}
