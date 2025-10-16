/**
 * Scheduled Reports Trigger API
 *
 * External cron service calls this endpoint to trigger report sending
 * Endpoint: POST /api/scheduled/send-reports?type=weekly|monthly|quarterly
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';
import { sendAllPartnerReports } from '../../utils/partnerReports';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Verify API key for security
    const apiKey = context.request.headers.get('X-API-Key');
    const expectedKey = context.env.SCHEDULED_API_KEY;

    if (!apiKey || !expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - Invalid API key'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get report type from query params
    const url = new URL(context.request.url);
    const reportType = url.searchParams.get('type') as 'weekly' | 'monthly' | 'quarterly' | null;

    if (!reportType || !['weekly', 'monthly', 'quarterly'].includes(reportType)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid report type. Must be: weekly, monthly, or quarterly'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Sending ${reportType} reports to all partners...`);

    // Send reports to all partners
    const results = await sendAllPartnerReports(reportType, context.env);

    console.log(`Reports sent: ${results.sent}, failed: ${results.failed}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        reportType,
        sent: results.sent,
        failed: results.failed,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error sending scheduled reports:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
