"""Generate accurate static SEO from the current public page catalog."""
from pathlib import Path
import argparse,html,json,re

ORIGIN='https://inspectorfocus.com'
PAGES=[
 ('/','Free Photography Tools by Mario Romay | Inspector Focus','Inspect EXIF, analyze photo stats, check print sizes, crop, convert, create PDF contact sheets and batch rename photos locally. Created by Mario Romay.','Inspector Focus',None),
 ('/exif/','JPEG EXIF Viewer & Metadata Remover | Inspector Focus','View JPEG camera settings, capture dates and GPS metadata. Remove detected metadata from a new copy without recompressing the photo. Process locally.','EXIF Data','Inspect JPEG shooting metadata and create a cleaned copy without recompressing the image.'),
 ('/photo-stats/','Photo EXIF Statistics & Shooting Charts | Inspector Focus','Analyze a JPEG collection by focal length, aperture, ISO, shutter speed, camera and shooting time. View charts and export aggregate CSV locally.','Photo Stats','Analyze recorded JPEG camera settings across a collection, with charts, missing-value counts and aggregate CSV export.'),
 ('/print-size/','Photo Print Size & PPI Calculator | Inspector Focus','Check photo print sizes and crop-aware PPI for JPEG, PNG, WebP, HEIC or AVIF. Compare framing and retained pixels locally before choosing a print size.','Print Size','Estimate print sizes, pixel density and the retained image area for a selected print crop.'),
 ('/export/','Crop, Resize & Convert Photos Locally | Inspector Focus','Crop, resize and convert JPEG, PNG, WebP, HEIC or AVIF photos. Export JPEG, PNG or WebP individually or in a batch ZIP, without uploading photographs.','Crop & Export','Crop, resize and convert photographs locally; download JPEG, PNG or WebP copies, individually or in a batch ZIP.'),
 ('/contact-sheet/','Photo Contact Sheet PDF Maker | Inspector Focus','Organize photos into printable PDF contact sheets. Reorder frames, add optional titles and centered filenames, and choose Letter or A4. No photo uploads.','Contact Sheet','Organize photographs and export a printable multi-page PDF contact sheet with optional filenames and photo numbers.'),
 ('/batch-rename/','Batch Photo Renamer & ZIP Download | Inspector Focus','Preview consistent photo filenames with a prefix, sequence and optional JPEG capture date. Download renamed originals in a ZIP, preserving quality and metadata.','Batch Rename','Preview sequential filenames and download renamed originals in a ZIP while preserving their exact bytes and metadata.'),
 ('/about/','Meet Inspector Focus: The Robot Comic | Inspector Focus','Meet Inspector Focus, the camera-inspired robot behind Mario Romay’s photography utilities, through his black-and-white origin comic.','Meet Inspector Focus',None),
]

def generate(root,indexable):
 for route,title,description,name,feature in PAGES:
  path=root/route.strip('/')/'index.html';s=path.read_text()
  s=re.sub(r'<title>.*?</title>','',s,flags=re.S)
  s=re.sub(r'<meta\b[^>]*(?:name="(?:description|author|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>','',s)
  s=re.sub(r'<link\b[^>]*rel="canonical"[^>]*>','',s)
  s=re.sub(r'<script\b[^>]*type="application/ld\+json"[^>]*>.*?</script>','',s,flags=re.S)
  url=ORIGIN+route;image=ORIGIN+'/brand/inspector-focus-social.png'
  creator={'@type':'Person','@id':ORIGIN+'/#creator','name':'Mario Romay','url':'https://marioromay.com'}
  site={'@type':'WebSite','@id':ORIGIN+'/#website','name':'Inspector Focus','url':ORIGIN+'/','creator':{'@id':creator['@id']}}
  page={'@type':'WebPage','@id':url+'#page','url':url,'name':title,'description':description,'isPartOf':{'@id':site['@id']},'creator':{'@id':creator['@id']},'inLanguage':'en'}
  graph=[creator,site,page]
  if feature:
   tool={'@type':'WebApplication','@id':url+'#tool','name':name,'url':url,'description':feature,'applicationCategory':'MultimediaApplication','operatingSystem':'Modern web browser','browserRequirements':'JavaScript and browser file APIs required','isAccessibleForFree':True,'offers':{'@type':'Offer','price':'0','priceCurrency':'USD'},'creator':{'@id':creator['@id']},'featureList':feature}
   graph.append(tool);page['mainEntity']={'@id':tool['@id']}
  else:page['about']={'@id':site['@id']}
  esc=lambda v:html.escape(v,quote=True)
  metas=[f'<title>{esc(title)}</title>',f'<meta name="description" content="{esc(description)}">','<meta name="author" content="Mario Romay">',f'<meta name="robots" content="{"index,follow,max-image-preview:large" if indexable else "noindex,nofollow"}">',f'<link rel="canonical" href="{url}">']
  values={'og:type':'website','og:site_name':'Inspector Focus','og:title':title,'og:description':description,'og:url':url,'og:image':image,'og:image:width':'1200','og:image:height':'630','og:image:alt':'Inspector Focus photography utilities by Mario Romay, with the black-and-white robot logo','og:locale':'en_US'}
  metas.extend(f'<meta property="{k}" content="{esc(v)}">' for k,v in values.items())
  metas.extend(f'<meta name="{k}" content="{esc(v)}">' for k,v in {'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':image,'twitter:image:alt':values['og:image:alt']}.items())
  metas.append('<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False).replace('<','\\u003c')+'</script>')
  s=s.replace('</head>','\n'+'\n'.join(metas)+'\n</head>');path.write_text(s)
 for path in root.rglob('index.html'):
  route='/'+str(path.parent.relative_to(root)).strip('.')+'/'
  if path==root/'index.html' or route in [p[0] for p in PAGES]:continue
  s=path.read_text();s=re.sub(r'<link rel="canonical" href="(/[^"]*)">',lambda m:'<link rel="canonical" href="'+ORIGIN+m[1]+'">',s)
  s=re.sub(r'<meta name="robots"[^>]*>','',s);s=s.replace('</head>','<meta name="robots" content="noindex,follow"></head>');path.write_text(s)
 urls=''.join('<url><loc>'+ORIGIN+p[0]+'</loc></url>\n' for p in PAGES)
 (root/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls+'</urlset>\n')
 (root/'robots.txt').write_text('User-agent: *\n'+('Allow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n' if indexable else 'Disallow: /\n'))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--directory',type=Path,default=(Path(__file__).resolve().parents[1]/'dist' if (Path(__file__).resolve().parents[1]/'dist').exists() else Path(__file__).resolve().parents[1]));parser.add_argument('--indexable',action='store_true');args=parser.parse_args();generate(args.directory,args.indexable)
