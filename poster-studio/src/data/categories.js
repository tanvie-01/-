import { ORG } from '../lib/constants.js'

// Every poster uses the same set of field keys; each category (and template)
// only changes the labels shown in the form and the starting text. A
// template's slots decide which fields actually appear on the poster, and the
// লেখা panel only shows those.
export const FIELD_DEFS = {
  topLine: { label: 'উপরের লাইন', type: 'text' },
  title: { label: 'শিরোনাম', type: 'text' },
  name: { label: 'নাম', type: 'text' },
  subtitle: { label: 'পদবি / পরিচয়', type: 'text' },
  message: { label: 'বার্তা', type: 'textarea' },
  date: { label: 'তারিখ', type: 'text' },
  time: { label: 'সময়', type: 'text' },
  venue: { label: 'স্থান', type: 'text' },
  extra: { label: 'অতিরিক্ত লাইন', type: 'text' },
  motto: { label: 'স্লোগান', type: 'text' },
  orgName: { label: 'সংগঠনের নাম', type: 'textarea' },
  orgLocation: { label: 'ঠিকানা', type: 'text' },
}

export const FIELD_ORDER = Object.keys(FIELD_DEFS)

export const COMMON_DEFAULTS = {
  topLine: 'বিসমিল্লাহির রাহমানির রাহীম',
  title: '',
  name: '',
  subtitle: '',
  message: '',
  date: '',
  time: '',
  venue: '',
  extra: '',
  motto: 'হাতে হাত ধরি, সুন্দর দেশ গড়ি',
  orgName: ORG.name,
  orgLocation: ORG.location,
}

export const CATEGORIES = [
  {
    id: 'congrats',
    label: 'অভিনন্দন',
    en: 'Congratulations',
    icon: '🎉',
    labels: { message: 'অভিনন্দনের কারণ', date: 'সেশন / সাল', extra: 'সেশনের বিবরণ' },
    defaults: {
      title: 'প্রাণঢালা অভিনন্দন',
      name: 'তানভীর হাসান শিহাব',
      subtitle: 'শিক্ষা বিষয়ক সম্পাদক',
      message: 'নির্বাচিত হওয়ায়',
      date: '২০২৬-২০২৭',
      extra: 'সেশনের কার্যনির্বাহী পরিষদ',
    },
  },
  {
    id: 'welcome',
    label: 'স্বাগতম',
    en: 'Welcome',
    icon: '🤝',
    labels: { message: 'স্বাগত বার্তা' },
    defaults: {
      title: 'স্বাগতম',
      name: 'মোঃ রফিকুল ইসলাম',
      subtitle: 'নবনির্বাচিত সভাপতি',
      message: 'আমাদের সংগঠনে আপনাকে জানাই আন্তরিক স্বাগতম ও শুভেচ্ছা',
      date: '২৬ অক্টোবর ২০২৬',
    },
  },
  {
    id: 'greetings',
    label: 'শুভেচ্ছা',
    en: 'Greetings',
    icon: '🌙',
    labels: { name: 'শুভেচ্ছা জানাচ্ছেন', extra: 'নামের উপরের লাইন', message: 'শুভেচ্ছা বার্তা' },
    defaults: {
      title: 'ঈদ মোবারক',
      name: 'তানভীর হাসান শিহাব',
      subtitle: 'সাধারণ সম্পাদক',
      message: 'পবিত্র ঈদুল ফিতরের শুভেচ্ছা। ঈদের আনন্দ ছড়িয়ে পড়ুক সবার ঘরে ঘরে।',
      extra: 'শুভেচ্ছান্তে',
    },
  },
  {
    id: 'event',
    label: 'অনুষ্ঠান',
    en: 'Event',
    icon: '📅',
    labels: { title: 'অনুষ্ঠানের নাম', name: 'অতিথি / বক্তার নাম', subtitle: 'অতিথির পরিচয়', message: 'অনুষ্ঠানের বিবরণ', extra: 'উপরের ছোট লাইন' },
    defaults: {
      title: 'বার্ষিক ক্রীড়া প্রতিযোগিতা ও পুরস্কার বিতরণী',
      name: 'জনাব আব্দুল করিম',
      subtitle: 'প্রধান অতিথি',
      message: 'অনুষ্ঠানে আপনার সপরিবারে উপস্থিতি একান্তভাবে কামনা করছি।',
      date: '১৫ ডিসেম্বর ২০২৬, মঙ্গলবার',
      time: 'সকাল ১০:০০ টা',
      venue: 'লৎসর সরকারি প্রাথমিক বিদ্যালয় মাঠ',
      extra: 'আয়োজনে',
    },
  },
  {
    id: 'achievement',
    label: 'পুরস্কার',
    en: 'Achievement',
    icon: '🏆',
    labels: { subtitle: 'সাফল্য / ফলাফল', extra: 'অনুষ্ঠান / উপলক্ষ', message: 'বার্তা' },
    defaults: {
      title: 'অভিনন্দন',
      name: 'তানভীর হাসান শিহাব',
      subtitle: 'এসএসসি ২০২৬ — জিপিএ ৫.০০',
      message: 'অসাধারণ সাফল্যের জন্য প্রাণঢালা অভিনন্দন ও শুভকামনা',
      extra: 'কৃতি শিক্ষার্থী সংবর্ধনা ২০২৬',
    },
  },
  {
    id: 'announcement',
    label: 'ঘোষণা',
    en: 'Announcement',
    icon: '📢',
    labels: { message: 'ঘোষণার বিষয়বস্তু', name: 'ঘোষণাকারী', subtitle: 'ঘোষণাকারীর পদবি' },
    defaults: {
      title: 'বিশেষ ঘোষণা',
      message:
        'আগামী শুক্রবার বিকাল ৪টায় সংস্থার কার্যালয়ে সাধারণ সভা অনুষ্ঠিত হবে। সভায় সকল সদস্যকে যথাসময়ে উপস্থিত থাকার জন্য বিশেষভাবে অনুরোধ করা হলো।',
      date: '২৬ অক্টোবর ২০২৬',
      name: 'তানভীর হাসান শিহাব',
      subtitle: 'সাধারণ সম্পাদক',
    },
  },
  {
    id: 'birthday',
    label: 'জন্মদিন',
    en: 'Birthday',
    icon: '🎂',
    labels: { message: 'শুভকামনা', date: 'জন্মতারিখ' },
    defaults: {
      title: 'শুভ জন্মদিন',
      name: 'আফরিন সুলতানা',
      subtitle: '',
      message: 'জীবনের প্রতিটি দিন হোক আনন্দময়, সুন্দর ও সাফল্যে ভরা',
      date: '২৬ অক্টোবর',
    },
  },
  {
    id: 'other',
    label: 'অন্যান্য',
    en: 'Other',
    icon: '✨',
    labels: {},
    defaults: {
      title: 'বিদায় সংবর্ধনা',
      name: 'জনাব মোঃ আবুল হোসেন',
      subtitle: 'সাবেক সভাপতি',
      message: 'আপনার নিরলস সেবা ও অবদান আমরা চিরদিন কৃতজ্ঞতার সাথে স্মরণ করব',
      date: '২৬ অক্টোবর ২০২৬',
    },
  },
]

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0]

export function fieldLabel(key, categoryId, template) {
  return template?.labels?.[key] || getCategory(categoryId).labels?.[key] || FIELD_DEFS[key]?.label || key
}
