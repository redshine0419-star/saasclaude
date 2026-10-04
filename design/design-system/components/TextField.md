# TextField

한 줄 입력과 선택 상자로, 라벨은 항상 입력칸 위에 둡니다.

- 라벨 `small` 600, 입력 글자 16px (휴대폰 확대 방지).
- 높이: 학부모 폼 `input-h`(52px), 관리자 44px. 테두리 `input-line`, 모서리 `radius-md` (테마 C는 14px).
- 포커스: `accent` 2px 외곽선.
- 오류: 테두리 `warn-ink` 2px + 아래 `caption` 크기 안내문. 무엇이 틀렸는지가 아니라 어떻게 고칠지 씁니다.
- placeholder는 예시만. 라벨을 대신하지 않습니다.
- 사용하는 쪽이 정할 것: 라벨, 종류(text/tel/select/textarea), 필수 여부, 오류 문구.
