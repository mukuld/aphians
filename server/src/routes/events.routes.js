import express from 'express';
import moment from 'moment-timezone';
import log from '../utils/logger.js';
import db from '../config/db.js';
import { formatToDDMMYYYY } from '../utils/dateUtils.js';
import { ensureAuthenticated } from '../middleware/authMiddleware.js'; // Import ensureAuthenticated

const router = express.Router();

// Fetch upcoming events for all users
async function fetchUpcomingEvents() {
  try {
    // Fetch all profiles
    const query = `
      SELECT user_id, full_name, birthday, marriage_anniversary, timezone
      FROM profiles
      WHERE (birthday IS NOT NULL OR marriage_anniversary IS NOT NULL)
    `;
    const [rows] = await db.query(query);
    log.debug('Fetched profiles for events:', { count: rows.length });

    const events = [];
    const now = moment();
    const sevenDaysFromNow = now.clone().add(7, 'days');

    for (const profile of rows) {
      const { user_id, full_name, birthday, marriage_anniversary, timezone } = profile;
      const userTz = timezone || 'UTC';

      const nowInUserTz = moment.tz(now, userTz);
      const sevenDaysFromNowInUserTz = nowInUserTz.clone().add(7, 'days');

      // Process Birthday
      if (birthday) {
        let nextBirthday = moment.tz(`${nowInUserTz.year()}-${moment(birthday).format('MM-DD')}`, userTz);
        if (nextBirthday.isBefore(nowInUserTz, 'day')) {
          nextBirthday.add(1, 'year');
        }
        if (nextBirthday.isSameOrAfter(nowInUserTz, 'day') && nextBirthday.isSameOrBefore(sevenDaysFromNowInUserTz, 'day')) {
          events.push({
            user_id,
            full_name,
            event_type: 'Birthday',
            date: formatToDDMMYYYY(nextBirthday),
          });
          log.debug(`Upcoming birthday found for ${full_name}: ${nextBirthday.format('YYYY-MM-DD')}`);
        }
      }

      // Process Marriage Anniversary
      if (marriage_anniversary) {
        let nextAnniversary = moment.tz(`${nowInUserTz.year()}-${moment(marriage_anniversary).format('MM-DD')}`, userTz);
        if (nextAnniversary.isBefore(nowInUserTz, 'day')) {
          nextAnniversary.add(1, 'year');
        }
        if (nextAnniversary.isSameOrAfter(nowInUserTz, 'day') && nextAnniversary.isSameOrBefore(sevenDaysFromNowInUserTz, 'day')) {
          events.push({
            user_id,
            full_name,
            event_type: 'Marriage Anniversary',
            date: formatToDDMMYYYY(nextAnniversary),
          });
          log.debug(`Upcoming anniversary found for ${full_name}: ${nextAnniversary.format('YYYY-MM-DD')}`);
        }
      }
    }

    // Sort events by date
    events.sort((a, b) => {
      const dateA = moment(a.date, 'DD/MM/YYYY');
      const dateB = moment(b.date, 'DD/MM/YYYY');
      return dateA - dateB;
    });

    log.info('Fetched upcoming events:', { count: events.length, events });
    return events;
  } catch (err) {
    log.error('Error fetching upcoming events:', { message: err.message, stack: err.stack });
    throw err;
  }
}

// Route to get upcoming events
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const events = await fetchUpcomingEvents();
    res.status(200).json(events);
  } catch (err) {
    log.error('Error in /api/events endpoint:', { message: err.message, stack: err.stack });
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;