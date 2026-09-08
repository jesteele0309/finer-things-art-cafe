export const defaults = {medium:'grainy analog photography',palette:'warm cream, saturated red and deep blue',motifs:'Windows, water, empty rooms',symbolic:false};
export const themes = {
  Change:{title:'Before You Are Ready',scene:'An unfinished plaster room. One sculptural red chair. An open doorway onto a calm ocean. Sunlight falls across the threshold.',line:'You’re allowed to begin before you become impressive.',invitation:'What is one imperfect version you could make today?'},
  Boundaries:{title:'A Room of Your Own',scene:'A quiet dining room with a single chair pulled toward an open window. A wide band of empty floor separates the chair from a crowded table.',line:'Space can be something you make.',invitation:'What would you move to make a little more room?'},
  Belonging:{title:'A Place at the Table',scene:'An intimate table with mismatched ceramic cups. One empty place setting catches the late afternoon light. A loosely draped linen cloth joins the edges.',line:'You don’t have to match to belong.',invitation:'Where can you arrive as you are?'},
  'Creative confidence':{title:'Still Becoming',scene:'A sculptor’s worktable, an unfinished clay form, worn tools, and a sheet of marked paper. Natural light reveals fingerprints in the clay.',line:'Not everything unfinished is a failure.',invitation:'What could you leave imperfect, on purpose?'}
};
export function localDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function scenePrompt(theme,preferences){const t=themes[theme]||themes.Change;return `${t.scene}\nMedium: ${preferences.medium}. Palette: ${preferences.palette}. Recurring motifs: ${preferences.motifs||'none selected'}.\nRestrained editorial fine art, tactile materials, thoughtful negative space. No text, logos, zodiac icons, glowing silhouettes or cosmic clip art.`;}
export function shareText(piece){return `${piece.title}\n${piece.line}\n\nINNERWORLD · The Finer Things ART SALON™`;}
export function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
