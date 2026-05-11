# Snippet Archiver 파라미터 사용 가이드

Snippet Archiver는 코드 내에 하드코딩된 값을 실행 시점에 자유롭게 변경할 수 있는 **매개변수(Parameter) 치환 기능**을 제공합니다.

## 1. 코드 작성 문법
코드 내에서 변동 가능성이 있는 부분을 중괄호 `{}`로 감싸서 작성합니다.

- **Python 예시:**
  ```python
  name = "{user_name}"
  print(f"Hello, {name}!")
  ```
- **CMD 예시:**
  ```cmd
  echo Current Target: {target_file}
  copy {target_file} backup_{target_file}
  ```
- **HTML 예시:**
  ```html
  <body style="background-color: {theme_color};">
    <h1>Welcome, {title}!</h1>
  </body>
  ```

## 2. 파라미터 정의 (Add/Edit Modal)
스니펫을 추가하거나 수정할 때, **'Parameter Definitions'** 섹션에서 코드에 사용된 파라미터를 등록해야 합니다.

1. **Name:** 코드 내 `{}` 안에 작성한 이름과 정확히 일치해야 합니다. (예: `user_name`)
2. **Default Value:** 실행 전 입력창에 기본적으로 채워져 있을 값입니다.
3. **작동 방식:** 파라미터를 정의하면, 스니펫 상세 화면에서 해당 파라미터들을 입력할 수 있는 전용 폼이 생성됩니다.

## 3. 실행 프로세스
1. **목록에서 스니펫 선택:** 정의된 파라미터들이 화면에 나타납니다.
2. **값 입력:** 기본값을 그대로 사용하거나, 원하는 값으로 수정합니다.
3. **Execute 클릭:** 시스템이 코드 내의 `{name}` 부분을 여러분이 입력한 값으로 **실제 치환**한 후 실행합니다.
   - *참고: 원본 코드는 변경되지 않으며, 실행 시에만 임시로 치환된 코드가 사용됩니다.*

## 4. 주의사항
- 파라미터 이름에 공백이나 특수문자를 사용하는 것보다 `snake_case`나 `camelCase`를 권장합니다.
- 중괄호 `{}` 자체를 코드 문법으로 사용해야 하는 경우(예: Python의 딕셔너리), 현재 시스템은 모든 `{}`를 치환 대상으로 인식하므로 주의가 필요합니다. (향후 이스케이프 기능 업데이트 예정)
