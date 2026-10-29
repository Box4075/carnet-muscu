/* Programme de Dany — prise de masse sèche, Lun → Ven, ~1 h 30 par séance.
   Exos validés sur le catalogue « Choix des machines » (Fitness Park). */

const PHOTO = q => "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(q);

const EX = {
  velo:        {n:"Vélo – échauffement", m:"Vélo", q:"Technogym bike", unit:"min"},
  rdl:         {n:"Soulevé de terre roumain", m:"Barre ou haltères", q:"romanian deadlift barbell"},
  sdt:         {n:"Soulevé de terre (technique)", m:"Barre au sol", q:"conventional deadlift barbell"},
  lc_assis:    {n:"Leg curl assis", m:"Technogym Selection Leg Curl", q:"Technogym Selection seated leg curl", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dwdb6d95e7/product/MNIP/selection_900_leg_curl_related.jpg?sw=640&q=75"},
  lc_allonge:  {n:"Leg curl allongé", m:"Technogym Selection Prone Leg Curl", q:"Technogym Selection prone leg curl", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw4f66349c/product/MNUP/selection_pro_prone_leg_curl_related_2.jpg?sw=640&q=75"},
  lc_genou:    {n:"Leg curl à genoux, une jambe", m:"Hammer Strength Kneeling Leg Curl", q:"Hammer Strength Iso-Lateral Kneeling Leg Curl", img:"https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Kneeling%20Leg%20Curl/Strength-PlateLoaded-IsoLateral-KneelingLegCurl-Thumbnail-1.png?w=640"},
  hip_hs:      {n:"Hip thrust machine", m:"Hammer Strength Glute Drive", q:"Hammer Strength Glute Drive", img:"https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Glute%20Drive/Strength-PlateLoaded-GluteDrive-8.png?w=640"},
  hip_tg:      {n:"Hip thrust machine (levier)", m:"Technogym Pure Hip Thrust", q:"Technogym Pure Hip Thrust", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dwfc127aef/product/MG80/pure-strength-hip-thrust_MG80_gallery01.jpg?sw=640&q=75"},
  abd:         {n:"Abducteurs", m:"Technogym Selection Abductor", q:"Technogym Selection abductor", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw3ad19639/product/MNPP/selection_900_abductor_related.jpg?sw=640&q=75"},
  abd_debout:  {n:"Abducteur debout", m:"Technogym Pure Standing Abductor", q:"Technogym Pure Standing Abductor", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw0833bd97/product/MG95/pure-strength-standing-abductor_MG95_gallery01.jpg?sw=640&q=75"},
  add:         {n:"Adducteurs", m:"Technogym Selection Adductor", q:"Technogym Selection adductor", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw9711e690/product/MNQP/selection_900_adductor_related.jpg?sw=640&q=75"},
  presse_hs:   {n:"Presse unilatérale, pieds hauts", m:"Hammer Strength Iso-Lateral Leg Press", q:"Hammer Strength Iso-Lateral Leg Press plate loaded", img:"https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/MediaSync/397-33-hs-plate-loaded-iso-lateral-leg-press-l.png?w=640"},
  presse_tg:   {n:"Presse assise", m:"Technogym Selection Leg Press", q:"Technogym Selection leg press", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw1af8e0cc/product/MNAP/selection_900_leg_press_related.jpg?sw=640&q=75"},
  presse_g80:  {n:"Presse horizontale", m:"Gym80", q:"gym80 horizontal leg press"},
  belt:        {n:"Belt squat", m:"Technogym", q:"Technogym belt squat", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dwfefadb97/product/MG86/pure-strength-belt-squat_MG86_gallery01.jpg?sw=640&q=75"},
  legext_iso:  {n:"Leg extension isométrique", m:"Technogym Selection Leg Extension", q:"Technogym Selection leg extension", unit:"s", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dwee5d3ed5/product/MNJP/selection_900_leg_extension_related.jpg?sw=640&q=75"},
  mollet_debout:{n:"Mollets debout machine", m:"Technogym Pure Calf", q:"Technogym Pure Calf", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw41c332bc/product/MG45/pure-strength-calf_MG45_gallery01.jpg?sw=640&q=75"},
  mollet_smith:{n:"Mollets debout Smith + step", m:"Smith machine", q:"smith machine calf raise step", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dwc6540271/product/MB82/MB82-packshot01.jpg?sw=640&q=75"},
  mollet_assis:{n:"Mollets assis", m:"Technogym Pure Seated Calf", q:"Technogym Pure Seated Calf", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw282d9ddd/product/MG46/pure-strength-seated-calf_MG46_gallery01.jpg?sw=640&q=75"},
  crunch_m:    {n:"Crunch machine", m:"Technogym / Hammer Strength", q:"Technogym Selection abdominal crunch", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw16dbc2c5/product/MNBP/selection_pro_abdominal_crunch_related_1.jpg?sw=640&q=75"},
  crunch_p:    {n:"Crunch à genoux à la poulie", m:"Poulie haute + corde", q:"kneeling cable crunch", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw9bd0e705/product/MQ0F/MQ0F_gallery01.jpg?sw=640&q=75"},
  releves:     {n:"Relevés de jambes", m:"Chaise romaine", q:"captain's chair leg raise", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dwed3dffe7/product/PA02-ANV0GG/PA02_verticalbench_element_related_01_6.jpg?sw=640&q=75"},
  lombaire:    {n:"Extensions lombaires 45°", m:"Banc à 45°", q:"45 degree back extension", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw79ef26b5/product/PG05-NBV000/PG05_purestrength_lowerbackbench_related_01_5.jpg?sw=640&q=75"},
  lat_hs:      {n:"Tirage vertical convergent", m:"Hammer Strength Front Lat Pulldown", q:"Hammer Strength Iso-Lateral Front Lat Pulldown", img:"https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/MediaSync/290-064-download-2-copy.png?w=640"},
  lat_poulie:  {n:"Tirage poitrine poulie, prise neutre", m:"Technogym Selection Lat Machine", q:"Technogym Selection lat machine", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw1c4de02f/product/MNLP/selection_900_lat_machine_related.jpg?sw=640&q=75"},
  tractions:   {n:"Tractions", m:"Barre / Vertical Traction assistée", q:"Technogym vertical traction", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dwd109d623/product/MNGP/selection_900_vertical_traction_related.jpg?sw=640&q=75"},
  row_iso:     {n:"Rowing convergent", m:"Technogym (iso-latéral)", q:"Technogym Pure row plate loaded", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw55f86a34/product/MG30/pure-strength-row_MG30_gallery01.jpg?sw=640&q=75"},
  row_haut:    {n:"Rowing haut", m:"Hammer Strength High Row", q:"Hammer Strength Iso-Lateral High Row", img:"https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/High%20Row/Strength-PlateLoaded-IsoLateral-HighRow-7.png?w=640"},
  row_bas:     {n:"Rowing assis", m:"Technogym Selection Low Row", q:"Technogym Selection low row", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw35619aa0/product/MNHP/selection_900_low_row_related.jpg?sw=640&q=75"},
  pullover_p:  {n:"Pull-over poulie haute", m:"Poulie + corde ou barre", q:"cable straight arm pulldown", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw9bd0e705/product/MQ0F/MQ0F_gallery01.jpg?sw=640&q=75"},
  pullover_m:  {n:"Pull-over machine", m:"Technogym Pure Pull Over", q:"Technogym Pure Pull Over", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw13a92d80/product/MG90/pure-strength-pullover_MG90_gallery01.jpg?sw=640&q=75"},
  oiseau:      {n:"Oiseau machine", m:"Pec deck en sens inverse", q:"reverse pec deck rear delt", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dwc84ee5a7/product/MNXP/selection_pro_reverse_fly_related_2.jpg?sw=640&q=75"},
  face_pull:   {n:"Face pull", m:"Poulie haute + corde", q:"face pull cable rope", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw420b5015/product/MB430N0-AN00GGGP/dual_adjustable_pulley_performance_anthracite_black.jpg?sw=640&q=75"},
  curl_pupitre:{n:"Curl pupitre machine", m:"Technogym Selection Arm Curl", q:"Technogym Selection arm curl", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw4947807e/product/MNRP/selection_900_arm_curl_related.jpg?sw=640&q=75"},
  curl_incl:   {n:"Curl incliné haltères", m:"Banc incliné", q:"incline dumbbell curl", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw4fc53483/product/PG04-NBV000/PG04_purestrength_adjustablebench_related_01_6.jpg?sw=640&q=75"},
  curl_marteau:{n:"Curl marteau", m:"Haltères", q:"hammer curl"},
  pecdeck:     {n:"Pec deck (butterfly)", m:"Technogym Selection Pectoral", q:"Technogym Selection pectoral", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw68779118/product/MNTP/selection_900_pectoral_related.jpg?sw=640&q=75"},
  superfly:    {n:"Écarté convergent", m:"Hammer Strength Super Fly", q:"Hammer Strength Super Fly", img:"https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Super%20Fly/Strength-PlateLoaded-SuperFly-Thumbnail-1.png?w=640"},
  visavis:     {n:"Écarté poulie vis-à-vis", m:"Double poulie", q:"cable crossover fly", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw07adeab4/product/MQ0C/MQ0C_gallery01.jpg?sw=640&q=75"},
  dc:          {n:"Développé couché barre", m:"Banc plat", q:"barbell bench press", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw91f11dd1/product/PG07-NBV000/PG07_purestrength_olympicflatbench_related_01_4.jpg?sw=640&q=75"},
  dc_hs:       {n:"Développé couché machine", m:"Hammer Strength Horizontal Bench Press", q:"Hammer Strength Iso-Lateral Horizontal Bench Press", img:"https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Horizontal%20Bench%20Press/Strength-PlateLoaded-IsoLateral-HorizontalBenchPress-8.png?w=640"},
  incl_halt:   {n:"Développé incliné haltères", m:"Banc incliné", q:"incline dumbbell press", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dwd02f6ccd/product/PG01/packshot_1_1_white.jpg?sw=640&q=75"},
  incl_hs:     {n:"Presse inclinée convergente", m:"Hammer Strength Incline Press", q:"Hammer Strength Iso-Lateral Incline Press", img:"https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Iso%20Lateral%20Incline%20Press/Strength-PlateLoaded-IsoLateralInclinePress-8.png?w=640"},
  wide_hs:     {n:"Presse pecs prise large", m:"Hammer Strength Wide Chest", q:"Hammer Strength Iso-Lateral Wide Chest", img:"https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Wide%20Chest/Strength-PlateLoaded-IsoLateral-WideChest-Thumbnail-1.png?w=640"},
  chest_tg:    {n:"Chest press", m:"Technogym", q:"Technogym chest press", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dwc98c1663/product/MG05/pure-strength-chest-press_MG05_gallery01.jpg?sw=640&q=75"},
  dev_ep:      {n:"Développé épaules machine", m:"Hammer Strength Shoulder Press", q:"Hammer Strength Iso-Lateral Shoulder Press", img:"https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Iso-Lateral%20Shoulder%20Press/Strength-PlateLoaded-IsoLateralShoulderPress-Render-2.png?w=640"},
  lat_raise_m: {n:"Élévations latérales machine", m:"Hammer Strength / Gym80", q:"Hammer Strength lateral raise machine", img:"https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Lateral%20Raise/Strength-PlateLoaded-LateralRaise-Thumbnail-1.png?w=640"},
  lat_raise_p: {n:"Élévations latérales poulie", m:"Poulie basse", q:"cable lateral raise", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw420b5015/product/MB430N0-AN00GGGP/dual_adjustable_pulley_performance_anthracite_black.jpg?sw=640&q=75"},
  tri_overhead:{n:"Extension triceps au-dessus de la tête", m:"Poulie + corde", q:"overhead cable triceps extension", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw420b5015/product/MB430N0-AN00GGGP/dual_adjustable_pulley_performance_anthracite_black.jpg?sw=640&q=75"},
  tri_poulie:  {n:"Extension triceps poulie haute", m:"Poulie + barre ou corde", q:"triceps pushdown", img:"https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw9bd0e705/product/MQ0F/MQ0F_gallery01.jpg?sw=640&q=75"}
};

/* s = séries, r = fourchette, rest = repos en secondes, ss = superset, kine = à valider avec le kiné */
const PROGRAMME = {
  1: { code:"A", titre:"Jambes", sous:"Ischios & fessiers", ex:[
    {id:"velo", s:1, r:"5-10", rest:0, note:"Puis tes exos d'activation du kiné."},
    {id:"rdl", s:4, r:"6-8", rest:150, note:"Dos neutre, descends à mi-tibia. Exo lourd de la séance : 1-2 reps en réserve."},
    {id:"lc_assis", s:3, r:"10-12", rest:90, alts:["lc_allonge","lc_genou"], note:"La meilleure version pour la masse des ischios."},
    {id:"hip_hs", s:4, r:"8-10", rest:120, alts:["hip_tg"], note:"Pause 1 s en haut, fessiers serrés."},
    {id:"lc_genou", s:3, r:"10-12", rest:75, alts:["lc_allonge"]},
    {id:"add", s:3, r:"12-15", rest:75},
    {id:"abd", s:3, r:"15-20", rest:60, alts:["abd_debout"], note:"Le moyen fessier stabilise ton genou."},
    {id:"mollet_debout", s:4, r:"10-15", rest:75, alts:["mollet_smith"], note:"Pause 2 s en bas, étiré."},
    {id:"crunch_m", s:3, r:"12-15", rest:60, alts:["crunch_p"]},
    {id:"releves", s:3, r:"10-15", rest:60}
  ]},
  2: { code:"B", titre:"Dos & biceps", sous:"Largeur, épaisseur, arrière d'épaule", ex:[
    {id:"velo", s:1, r:"5", rest:0},
    {id:"lat_hs", s:4, r:"6-10", rest:120, alts:["tractions","lat_poulie"], note:"Tire avec les coudes, pas avec les mains."},
    {id:"row_iso", s:4, r:"8-10", rest:120, alts:["row_bas","row_haut"]},
    {id:"lat_poulie", s:3, r:"10-12", rest:90, alts:["tractions"]},
    {id:"row_haut", s:3, r:"10-12", rest:90},
    {id:"pullover_p", s:3, r:"12-15", rest:75, alts:["pullover_m"], note:"Bras tendus, sens les dorsaux s'étirer."},
    {id:"oiseau", s:3, r:"15-20", rest:60, alts:["face_pull"], note:"Arrière d'épaule : aide ton développé couché."},
    {id:"curl_incl", s:3, r:"8-12", rest:75, alts:["curl_pupitre"], note:"Bras longs = biceps étirés, idéal."},
    {id:"curl_marteau", s:3, r:"10-12", rest:60},
    {id:"lombaire", s:3, r:"12-15", rest:60, note:"Lent et contrôlé. On renforce, on ne force pas."}
  ]},
  3: { code:"C", titre:"Pecs & épaules", sous:"Sentir les pecs, protéger l'épaule", ex:[
    {id:"velo", s:1, r:"5", rest:0},
    {id:"face_pull", s:2, r:"15-20", rest:45, note:"Échauffement de l'arrière d'épaule, léger."},
    {id:"pecdeck", s:2, r:"12-15", rest:60, alts:["superfly"], note:"Pré-activation : les pecs travaillent avant que les triceps prennent le relais."},
    {id:"dc", s:4, r:"4-6", rest:180, alts:["dc_hs"], note:"Omoplates serrées, coudes à ~45°, 1 s de pause sur la poitrine. Raideur à l'arrière de l'épaule → prise un poil plus serrée ou machine."},
    {id:"incl_hs", s:3, r:"8-10", rest:120, alts:["incl_halt"], note:"Haut des pecs. Pense « coudes vers l'intérieur », pas « pousser avec les mains »."},
    {id:"visavis", s:3, r:"12-15", rest:75, alts:["superfly","pecdeck"], note:"Contraction 1 s mains jointes."},
    {id:"dev_ep", s:3, r:"8-10", rest:120},
    {id:"lat_raise_m", s:4, r:"12-15", rest:60, alts:["lat_raise_p"], note:"Largeur d'épaules : la priorité en classic."},
    {id:"tri_overhead", s:3, r:"10-12", rest:75, alts:["tri_poulie"], note:"Tes triceps sont déjà forts : pas plus."}
  ]},
  4: { code:"D", titre:"Jambes", sous:"Quadris (genou), ischios, adducteurs", ex:[
    {id:"velo", s:1, r:"5-10", rest:0, note:"Puis tes exos d'activation du kiné."},
    {id:"sdt", s:3, r:"5", rest:150, note:"Technique propre, charge modérée. +5 kg par semaine au maximum si le dos va bien."},
    {id:"presse_hs", s:4, r:"10-12", rest:120, alts:["presse_tg","presse_g80","belt"], kine:true, note:"Pieds hauts et larges. Descends tant que la douleur reste ≤ 3/10. Au-dessus → stop, remplace par hip thrust."},
    {id:"legext_iso", s:4, r:"30-45", rest:60, kine:true, note:"Isométrie : angle et charge donnés par ton kiné. Les reps = secondes tenues."},
    {id:"hip_tg", s:3, r:"10-12", rest:90, alts:["hip_hs"]},
    {id:"lc_allonge", s:3, r:"10-12", rest:90, alts:["lc_assis","lc_genou"]},
    {id:"abd_debout", s:3, r:"12-15", rest:60, alts:["abd"]},
    {id:"add", s:3, r:"12-15", rest:60},
    {id:"mollet_assis", s:4, r:"12-15", rest:60, alts:["mollet_smith"]},
    {id:"crunch_p", s:3, r:"12-15", rest:60, alts:["crunch_m"]}
  ]},
  5: { code:"E", titre:"Haut du corps", sous:"Dos + pecs en supersets", ex:[
    {id:"velo", s:1, r:"5", rest:0},
    {id:"tractions", s:4, r:"6-10", rest:90, ss:"1", alts:["lat_hs","lat_poulie"], note:"Superset 1 avec l'exo suivant."},
    {id:"wide_hs", s:4, r:"8-10", rest:120, ss:"1", alts:["chest_tg","dc_hs"], note:"Prise large = moins de triceps."},
    {id:"row_bas", s:3, r:"10-12", rest:75, ss:"2", alts:["row_iso"]},
    {id:"incl_halt", s:3, r:"8-10", rest:90, ss:"2", alts:["incl_hs"], note:"Descente en 3 s, étire les pecs."},
    {id:"superfly", s:3, r:"12-15", rest:60, ss:"3", alts:["pecdeck","visavis"]},
    {id:"pullover_p", s:2, r:"12-15", rest:60, ss:"3", alts:["pullover_m"]},
    {id:"lat_raise_p", s:3, r:"15-20", rest:60, alts:["lat_raise_m"]},
    {id:"curl_pupitre", s:3, r:"10-12", rest:60, ss:"4", alts:["curl_incl"]},
    {id:"tri_poulie", s:2, r:"12-15", rest:60, ss:"4"},
    {id:"face_pull", s:2, r:"15-20", rest:45}
  ]}
};

const JOURS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
