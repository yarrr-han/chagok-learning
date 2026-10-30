"""Run against a running dev/preview server; optional original-build comparison.
python3 tests/browser_smoke.py --url http://127.0.0.1:4173 --baseline http://127.0.0.1:8001
Uses disposable contexts only; never touches an existing browser profile.
"""
import argparse
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

KEY = 'chagok-learning-v1'
parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:4173')
parser.add_argument('--baseline')
parser.add_argument('--chromium', help='Optional Chromium executable path')
args = parser.parse_args()


def stored(page):
    return page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', arg=KEY)


def create_plan(page):
    page.get_by_role('button', name='새 지도계획', exact=True).click()
    page.locator('select').nth(3).select_option(label='국정 교과서')
    page.locator('select').nth(4).select_option(label='1단원 · 덧셈과 뺄셈')
    page.get_by_role('button', name='계획 구성하기', exact=True).click()
    assert page.locator('.lesson-editor').count() == 6
    page.get_by_role('button', name='지도계획 저장', exact=True).click()
    page.wait_for_function('(key) => JSON.parse(localStorage.getItem(key)).plans.length === 1', arg=KEY)
    assert len(stored(page)['plans'][0]['lessons']) == 6


with sync_playwright() as p:
    chromium = args.chromium or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else p.chromium.executable_path)
    browser = p.chromium.launch(executable_path=chromium, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, timezone_id='Asia/Seoul')
    # External fonts are optional. Use the same fallback fonts for deterministic comparisons.
    context.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/'), lambda route: route.abort())
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    assert page.goto(args.url, wait_until='networkidle').status == 200
    expect(page).to_have_title('차곡 — 기초학력 지도 도우미')
    assert page.locator('#root svg').count() > 0

    if args.baseline:
        original = context.new_page()
        original_errors = []
        original.on('pageerror', lambda error: original_errors.append(str(error)))
        original.goto(args.baseline, wait_until='networkidle')
        assert original.locator('body').inner_text() == page.locator('body').inner_text()
        assert original.screenshot(full_page=True) == page.screenshot(full_page=True), 'Desktop screenshot differs'
        for target in [original, page]:
            target.set_viewport_size({'width': 390, 'height': 844})
        assert original.screenshot(full_page=True) == page.screenshot(full_page=True), 'Mobile screenshot differs'
        page.set_viewport_size({'width': 1440, 'height': 1000})
        create_plan(original)
        legacy = stored(original)
        page.evaluate('([key, data]) => localStorage.setItem(key, JSON.stringify(data))', [KEY, legacy])
        page.reload(wait_until='networkidle')
        assert stored(page) == legacy
        assert '덧셈과 뺄셈' in page.locator('body').inner_text()
        assert not original_errors, original_errors
        original.close()
        print('PASS: exact desktop/mobile screenshots and original-build storage compatibility')
    else:
        create_plan(page)

    # Edit an existing plan without changing identifiers or losing connections.
    initial = stored(page)
    page.locator('.plan-row').first.click()
    page.get_by_role('button', name='계획 수정', exact=True).click()
    page.get_by_label('학습 목표', exact=True).first.fill('복원 검증 학습 목표')
    page.get_by_role('button', name=re.compile('수정.*저장|지도계획 저장')).click()
    page.wait_for_function('(key) => JSON.parse(localStorage.getItem(key)).plans[0].lessons[0].title === "복원 검증 학습 목표"', arg=KEY)
    assert stored(page)['plans'][0]['lessons'][0]['id'] == initial['plans'][0]['lessons'][0]['id']

    page.get_by_role('button', name='지도일지', exact=True).click()
    page.get_by_role('button', name='지도일지 작성', exact=True).click()
    page.get_by_label('학생 반응 · 관찰 · 다음 지도').fill('구체물을 사용해 스스로 해결했습니다.')
    page.get_by_role('checkbox').check()
    page.get_by_role('button', name='완료 일지 저장', exact=True).click()
    page.wait_for_function('(key) => JSON.parse(localStorage.getItem(key)).journals.length === 1', arg=KEY)
    assert stored(page)['journals'][0]['done'] is True
    with page.expect_download() as csv_download:
        page.get_by_role('button', name='CSV 내려받기', exact=True).click()
    assert '구체물을 사용해' in Path(csv_download.value.path()).read_text(encoding='utf-8-sig')

    page.get_by_role('button', name='수업 달력', exact=True).click()
    page.get_by_role('button', name=re.compile(r'5차시 일정 확정')).click()
    page.wait_for_function('(key) => JSON.parse(localStorage.getItem(key)).bookings.length === 5', arg=KEY)
    snapshot = stored(page)
    page.reload(wait_until='networkidle')
    assert stored(page) == snapshot

    page.get_by_role('button', name='이용 안내', exact=True).first.click()
    with page.expect_download() as backup_download:
        page.get_by_role('button', name='전체 기록 JSON 백업', exact=True).click()
    assert json.loads(Path(backup_download.value.path()).read_text()) == snapshot
    page.locator('input[type=file]').set_input_files({'name': 'invalid.json', 'mimeType': 'application/json', 'buffer': b'{invalid'})
    expect(page.get_by_role('alert')).to_contain_text('JSON')
    assert stored(page) == snapshot
    page.locator('input[type=file]').set_input_files({'name': 'backup.json', 'mimeType': 'application/json', 'buffer': json.dumps(snapshot, ensure_ascii=False).encode()})
    page.once('dialog', lambda dialog: dialog.accept())
    page.get_by_role('button', name='이 백업으로 현재 기록 교체', exact=True).click()
    expect(page.get_by_role('dialog')).to_have_count(0)
    assert stored(page) == snapshot

    page.locator('.plan-row').first.click()
    page.once('dialog', lambda dialog: dialog.accept())
    page.get_by_role('button', name='계획 삭제', exact=True).click()
    page.wait_for_function('(key) => JSON.parse(localStorage.getItem(key)).plans.length === 0', arg=KEY)
    final = stored(page)
    assert final['journals'] == [] and final['bookings'] == []
    assert not errors, errors
    print('PASS: plan editing, completed journal, CSV export, scheduling, reload, backup export/restore, invalid-backup rejection and linked-record deletion; no JavaScript errors')
    context.close()
    browser.close()
