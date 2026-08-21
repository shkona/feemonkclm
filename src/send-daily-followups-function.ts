// This is a Supabase Edge Function
// Deploy to: supabase/functions/send-daily-followups/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  try {
    // Get today's follow-ups for leads
    const today = new Date().toISOString().split('T')[0]
    
    const { data: leadFollowups, error: leadsError } = await supabase
      .from('lead_followups')
      .select(`
        id,
        followup_date,
        followup_time,
        comment,
        lead_id,
        user_id,
        users!lead_followups_user_id_fkey(name),
        leads(name)
      `)
      .eq('followup_date', today)
      .order('followup_time')

    if (leadsError) throw leadsError

    // Get today's follow-ups for visits
    const { data: visitFollowups, error: visitsError } = await supabase
      .from('visit_followups')
      .select(`
        id,
        followup_date,
        followup_time,
        comment,
        visit_id,
        user_id,
        users!visit_followups_user_id_fkey(name),
        visits(prospect_name)
      `)
      .eq('followup_date', today)
      .order('followup_time')

    if (visitsError) throw visitsError

    // If no follow-ups, don't send email
    if ((!leadFollowups || leadFollowups.length === 0) && (!visitFollowups || visitFollowups.length === 0)) {
      return new Response(
        JSON.stringify({ message: 'No follow-ups for today' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Format follow-ups by associate
    const followupsByAssociate: { [key: string]: any[] } = {}

    leadFollowups?.forEach((followup: any) => {
      const name = followup.users?.name || 'Unknown'
      if (!followupsByAssociate[name]) followupsByAssociate[name] = []
      followupsByAssociate[name].push({
        type: 'Lead',
        name: followup.leads?.name,
        time: followup.followup_time,
        comment: followup.comment
      })
    })

    visitFollowups?.forEach((followup: any) => {
      const name = followup.users?.name || 'Unknown'
      if (!followupsByAssociate[name]) followupsByAssociate[name] = []
      followupsByAssociate[name].push({
        type: 'Prospect',
        name: followup.visits?.prospect_name,
        time: followup.followup_time,
        comment: followup.comment
      })
    })

    // Create email HTML
    let emailHtml = `
      <h2>Today's Follow-ups - ${new Date().toLocaleDateString('en-IN')}</h2>
      <p>Hi Team,</p>
      <p>Here are today's follow-ups:</p>
    `

    Object.entries(followupsByAssociate).forEach(([associate, followups]: [string, any]) => {
      emailHtml += `
        <h3>${associate}</h3>
        <ul>
      `
      followups.forEach((followup: any) => {
        emailHtml += `
          <li>
            <strong>${followup.type}: ${followup.name}</strong> at ${followup.time}
            <br/>
            <em>${followup.comment}</em>
          </li>
        `
      })
      emailHtml += `</ul>`
    })

    emailHtml += `
      <p>Please ensure these follow-ups are completed on time.</p>
      <p>Best regards,<br/>FeeMonk System</p>
    `

    // Send email using Resend (alternative: use SendGrid, Mailgun, etc.)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'FeeMonk <noreply@feemonk.com>',
        to: 'onboarding@feemonk.com',
        subject: `Daily Follow-ups - ${new Date().toLocaleDateString('en-IN')}`,
        html: emailHtml
      })
    })

    if (!emailResponse.ok) {
      throw new Error(`Failed to send email: ${emailResponse.statusText}`)
    }

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
