import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface FeedbackCampaignInviteEmailProps {
  campaignName?: string
  targetPersonName: string
  inviteLink: string
  startDate: string
  endDate: string
  creatorName?: string
}

export function FeedbackCampaignInviteEmail({
  campaignName,
  targetPersonName,
  inviteLink,
  startDate,
  endDate,
  creatorName,
}: FeedbackCampaignInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        You've been invited to provide feedback for {targetPersonName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Feedback Request</Heading>
          <Text style={text}>
            {creatorName ? `${creatorName} has` : 'You have'} been invited to
            provide feedback for <strong>{targetPersonName}</strong>.
          </Text>
          {campaignName && (
            <Text style={text}>
              <strong>Campaign:</strong> {campaignName}
            </Text>
          )}
          <Text style={text}>
            <strong>Feedback Period:</strong> {startDate} - {endDate}
          </Text>
          <Section style={buttonContainer}>
            <Link style={button} href={inviteLink}>
              Provide Feedback
            </Link>
          </Section>
          <Text style={text}>
            Or copy and paste this link into your browser:
          </Text>
          <Text style={linkText}>{inviteLink}</Text>
          <Text style={footer}>
            This feedback request is confidential. If you have any questions,
            please contact the campaign creator.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  padding: '0 40px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
  padding: '0 40px',
}

const buttonContainer = {
  padding: '27px 40px',
}

const button = {
  backgroundColor: '#007bff',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
}

const linkText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px',
  padding: '0 40px',
  wordBreak: 'break-all' as const,
}

const footer = {
  color: '#999',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '32px 0 0',
  padding: '0 40px',
}
