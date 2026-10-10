/* Africane Bloom webshop — configuration.
   Fill in the two values from Supabase: Project Settings → API.
   Both are PUBLIC values (the "anon" key is designed to be in the browser;
   access is protected by the Row Level Security rules in supabase/schema.sql).
   NEVER paste the "service_role" key here. */
window.AB_SHOP_CONFIG = {
  supabaseUrl: '',      // e.g. 'https://abcdefgh.supabase.co'
  supabaseAnonKey: '',  // the long "anon public" key
  // New orders / new customers are announced to this FormSubmit endpoint
  // (the same one the contact form already uses).
  notifyEndpoint: 'https://formsubmit.co/ajax/dc7087dd982518597a18847399951c8d'
};
