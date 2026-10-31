"""Real Korean OCR, text PDF and scanned PDF integration tests using synthetic documents."""
import argparse, base64, json, tempfile
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://127.0.0.1:8010/chagok-learning/')
args=parser.parse_args()
KEY='chagok-learning-v1'
with tempfile.TemporaryDirectory() as directory, sync_playwright() as p:
 root=Path(directory)
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 fixture=b.new_page(viewport={'width':1400,'height':600},device_scale_factor=1)
 fixture.set_content('''<html lang="ko"><meta charset="utf-8"><style>body{font-family:"Noto Sans CJK KR";font-size:40px;line-height:2;padding:35px;color:black;background:white}p{margin:0}</style><p>1차시 원의 중심 알아보기</p><p>2차시 반지름 알아보기</p><p>3차시 지름 알아보기</p></html>''')
 fixture.evaluate('document.fonts.ready')
 fixture.screenshot(path=str(root/'lessons.png'),full_page=True)
 fixture.pdf(path=str(root/'text.pdf'),width='1400px',height='700px',print_background=True)
 image=base64.b64encode((root/'lessons.png').read_bytes()).decode()
 fixture.set_content(f'<style>body{{margin:0}}</style><img style="width:100%" src="data:image/png;base64,{image}">')
 fixture.locator('img').evaluate('(img)=>img.decode()')
 fixture.pdf(path=str(root/'scan.pdf'),width='1400px',height='700px',print_background=True)
 fixture.close()
 context=b.new_context(viewport={'width':1440,'height':1100})
 external=[];errors=[];bad=[]
 allowed=urlparse(args.url).netloc
 def route(request):
  url=request.request.url
  if url.startswith(('http:','https:')) and urlparse(url).netloc!=allowed:
   if 'fonts.googleapis.com' not in url and 'fonts.gstatic.com' not in url: external.append(url)
   request.abort()
  else: request.continue_()
 context.route('**/*',route)
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:bad.append((r.status,r.url)) if r.status>=400 and '/favicon' not in r.url else None)
 page.goto(args.url,wait_until='networkidle')
 page.get_by_role('button',name='새 지도계획',exact=True).click()
 expect(page.get_by_role('tab',name='파일로 만들기')).to_have_attribute('aria-selected','true')
 upload=page.locator('input[type=file]')
 for name in ['text.pdf','lessons.png','scan.pdf']:
  upload.set_input_files(str(root/name))
  page.get_by_role('button',name='파일에서 차시 읽기',exact=True).click()
  expect(page.get_by_role('button',name='파일에서 차시 읽기',exact=True)).to_be_enabled(timeout=180000)
  raw=page.get_by_label('읽은 내용 · 직접 붙여넣기').input_value()
  print(name,'extracted:',raw,flush=True)
  assert '반지름' in raw and '지름' in raw
  expect(page.locator('.import-row')).to_have_count(3)
  assert '반지름' in page.get_by_label('2번째 차시 제목',exact=True).input_value()
  assert not page.get_by_role('checkbox',name='원본과 비교해 차시 번호·순서·제목을 확인했어요.').is_checked()
 # A PDF can also be explicitly OCR-read when its embedded text is incomplete.
 upload.set_input_files(str(root/'text.pdf'))
 page.get_by_role('checkbox',name='PDF를 이미지로 읽기 (글자가 누락될 때)').check()
 page.get_by_role('button',name='파일에서 차시 읽기',exact=True).click()
 expect(page.get_by_role('button',name='파일에서 차시 읽기',exact=True)).to_be_enabled(timeout=180000)
 expect(page.locator('.import-row')).to_have_count(3)
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile horizontal overflow'
 page.screenshot(path='/tmp/chagok-import-mobile.png',full_page=True)
 page.set_viewport_size({'width':1440,'height':1100})
 # Review, select, reorder and generate only requested lessons.
 page.get_by_label('단원명',exact=True).fill('원')
 page.get_by_label('학년 · 과목 · 교과서 (선택)',exact=True).fill('3학년 수학 · 테스트 자료')
 page.get_by_label('2번째 차시 제목',exact=True).fill('반지름의 길이 알아보기')
 page.get_by_role('checkbox',name='1번째 항목 포함',exact=True).uncheck()
 page.get_by_label('3번째 차시 위로',exact=True).click()
 page.get_by_role('checkbox',name='원본과 비교해 차시 번호·순서·제목을 확인했어요.').check()
 page.get_by_role('button',name='2개 차시로 지도계획 만들기',exact=True).click()
 expect(page.locator('.lesson-editor')).to_have_count(2)
 assert page.locator('.lesson-editor').nth(1).locator('input').input_value()=='반지름의 길이 알아보기'
 page.get_by_role('button',name='이전',exact=True).click()
 expect(page.locator('.import-row')).to_have_count(3)
 page.get_by_role('button',name='2개 차시로 지도계획 만들기',exact=True).click()
 page.get_by_role('button',name='지도계획 저장',exact=True).click()
 page.wait_for_function('(key)=>JSON.parse(localStorage.getItem(key)).plans.length===1',arg=KEY)
 data=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
 assert len(data['plans'][0]['lessons'])==2
 assert data['plans'][0]['lessons'][1]['sourceLabel'].endswith('2차시')
 page.reload(wait_until='networkidle')
 assert page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)==data
 print('PASS: real Korean image OCR, text PDF, scanned PDF, review/edit/reorder/select, back navigation and persistence',flush=True)
 # Unsupported files and corrupt PDFs are recoverable; never create plans on failure.
 page.get_by_role('button',name='새 지도계획',exact=True).click()
 upload=page.locator('input[type=file]')
 upload.set_input_files({'name':'bad.txt','mimeType':'text/plain','buffer':b'not an image'})
 expect(page.get_by_role('alert')).to_contain_text('PNG')
 upload.set_input_files({'name':'broken.pdf','mimeType':'application/pdf','buffer':b'not a PDF'})
 page.get_by_role('button',name='파일에서 차시 읽기',exact=True).click()
 expect(page.get_by_role('alert')).to_be_visible(timeout=30000)
 assert len(page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)['plans'])==1
 upload.set_input_files(str(root/'lessons.png'))
 page.get_by_role('button',name='파일에서 차시 읽기',exact=True).click()
 page.get_by_role('button',name='읽기 취소',exact=True).click()
 expect(page.get_by_role('button',name='파일에서 차시 읽기',exact=True)).to_be_enabled()
 page.get_by_role('button',name='파일에서 차시 읽기',exact=True).click()
 expect(page.locator('.import-row')).to_have_count(3,timeout=180000)
 assert not external,external
 assert not errors,errors
 assert not bad,bad
 print('PASS: invalid files, cancellation/retry and no external document/model requests',flush=True)
 context.close();b.close()
