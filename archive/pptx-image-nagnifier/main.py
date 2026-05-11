import zipfile
import tempfile
import os
import shutil
import xml.etree.ElementTree as ET

def zoom_images_via_zip(input_file, output_file, zoom_factor=2.0):
    """
    PPTX 파일을 ZIP 아카이브로 취급하여 직접 XML을 수정하는 방식으로 이미지를 확대합니다.
    외부 라이브러리(python-pptx) 설치 없이 파이썬 내장 모듈만 사용합니다.
    """
    if zoom_factor <= 1.0:
        print("오류: 확대 배수는 1.0보다 커야 합니다.")
        return

    # XML에서 100%는 100,000으로 표현됩니다. (ST_PositiveFixedPercentage)
    # 예: 2배(2.0) 확대 -> 보여야 할 부분 50% -> 양쪽에서 각각 25%씩 자름(25000)
    visible_ratio = 1.0 / zoom_factor
    crop_percentage = (1.0 - visible_ratio) / 2.0
    crop_val = str(int(crop_percentage * 100000))

    # XML 네임스페이스 등록 (수정 시 기본 네임스페이스가 유지되도록 함)
    namespaces = {
        'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }
    for prefix, uri in namespaces.items():
        ET.register_namespace(prefix, uri)

    image_count = 0

    print(f"'{input_file}' 파일 압축 해제 및 XML 분석 중...")
    
    # 임시 폴더 생성하여 작업
    with tempfile.TemporaryDirectory() as temp_dir:
        # 1. PPTX(ZIP) 압축 풀기
        with zipfile.ZipFile(input_file, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)

        # 2. 슬라이드 XML 파일들이 있는 경로 찾기
        slides_dir = os.path.join(temp_dir, 'ppt', 'slides')
        
        if os.path.exists(slides_dir):
            for filename in os.listdir(slides_dir):
                if filename.endswith('.xml'):
                    filepath = os.path.join(slides_dir, filename)
                    
                    # XML 파싱
                    tree = ET.parse(filepath)
                    root = tree.getroot()

                    # 슬라이드 내의 모든 그림(p:pic) 요소 찾기
                    # 그림의 배경 채우기(p:blipFill) 부분에 자르기(a:srcRect) 정보가 들어갑니다.
                    for pic in root.findall('.//p:pic', namespaces):
                        blipFill = pic.find('p:blipFill', namespaces)
                        if blipFill is not None:
                            # 기존 크롭 정보(a:srcRect)가 있는지 확인
                            srcRect = blipFill.find('a:srcRect', namespaces)
                            if srcRect is None:
                                # [수정됨] XML 스키마 순서 엄수 (a:blip -> a:srcRect -> a:stretch)
                                # 없으면 새로 생성하되, 무조건 뒤에 붙이지 않고 지정된 순서에 끼워넣음
                                srcRect = ET.Element('{' + namespaces['a'] + '}srcRect')
                                
                                # a:blip의 위치를 찾아 그 바로 뒤에 삽입
                                blip = blipFill.find('a:blip', namespaces)
                                insert_idx = 0
                                if blip is not None:
                                    blip_index = list(blipFill).index(blip)
                                    insert_idx = blip_index + 1
                                
                                blipFill.insert(insert_idx, srcRect)
                            
                            # 상하좌우 크롭 비율 설정 (중앙 줌 효과)
                            srcRect.set('l', crop_val) # Left
                            srcRect.set('t', crop_val) # Top
                            srcRect.set('r', crop_val) # Right
                            srcRect.set('b', crop_val) # Bottom
                            
                            image_count += 1
                    
                    # 수정된 XML 저장
                    tree.write(filepath, encoding='utf-8', xml_declaration=True)

        # 3. 수정한 파일들을 다시 PPTX(ZIP)로 압축
        print("수정 완료. 새로운 PPTX 파일로 패키징 중...")
        with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zip_out:
            for folder_path, _, filenames in os.walk(temp_dir):
                for file in filenames:
                    file_path = os.path.join(folder_path, file)
                    # 압축 파일 내부의 상대 경로 계산 (Windows 환경 호환성을 위해 구분자를 /로 통일)
                    arcname = os.path.relpath(file_path, temp_dir).replace(os.sep, '/')
                    zip_out.write(file_path, arcname)

    print(f"\n작업 완료! 총 {image_count}개의 이미지를 {zoom_factor}배 확대했습니다.")
    print(f"결과물이 '{output_file}'로 저장되었습니다.")

if __name__ == "__main__":
    INPUT_PPTX = "{INPUT_PPTX_P}"
    OUTPUT_PPTX = "{OUTPUT_PPTX_P}"
    TARGET_ZOOM = {TARGET_ZOOM_P}

    if not os.path.exists(INPUT_PPTX):
        print(f"'{INPUT_PPTX}' 파일을 찾을 수 없습니다.")
    else:
        zoom_images_via_zip(INPUT_PPTX, OUTPUT_PPTX, zoom_factor=TARGET_ZOOM)