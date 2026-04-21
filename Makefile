SHELL := /bin/bash

PHOTOS_DIR := public/photos
QUALITY := 95

# 변환 대상 확장자 패턴 (find용)
FIND_ORIGINALS := find "$(PHOTOS_DIR)" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.arw' -o -iname '*.heic' -o -iname '*.dng' \) -print0

.PHONY: convert clean-originals help check-deps

help: ## 사용법 출력
	@echo ""
	@echo "사용법:"
	@echo "  make convert          새 이미지를 WebP로 변환 (해상도 유지, 메타데이터 보존)"
	@echo "  make clean-originals  변환 완료된 원본 파일 삭제"
	@echo "  make help             이 도움말 출력"
	@echo ""

check-deps:
	@which cwebp > /dev/null 2>&1 || { \
		echo "cwebp가 설치되어 있지 않습니다. 설치합니다..."; \
		brew install webp; \
	}
	@which sips > /dev/null 2>&1 || { \
		echo "Error: sips를 찾을 수 없습니다 (macOS 전용 도구)"; \
		exit 1; \
	}

convert: check-deps ## 새 이미지를 WebP로 변환
	@count=$$(LC_ALL=C $(FIND_ORIGINALS) | LC_ALL=C tr -cd '\0' | LC_ALL=C wc -c | tr -d ' '); \
	if [ "$$count" = "0" ]; then \
		echo "변환할 이미지가 없습니다."; \
		exit 0; \
	fi; \
	echo "변환 대상: $$count개 파일"; \
	SUCCESS=0; FAIL=0; \
	while IFS= read -r -d '' file; do \
		dir=$$(dirname "$$file"); \
		base=$$(basename "$$file"); \
		name="$${base%.*}"; \
		ext=$$(echo "$${base##*.}" | tr '[:upper:]' '[:lower:]'); \
		output="$$dir/$$name.webp"; \
		if [ -f "$$output" ]; then \
			echo "  ⏭ $$base (이미 변환됨)"; \
			continue; \
		fi; \
		if [ "$$ext" = "jpg" ] || [ "$$ext" = "jpeg" ] || [ "$$ext" = "png" ]; then \
			if cwebp -q $(QUALITY) -metadata all "$$file" -o "$$output" > /dev/null 2>&1; then \
				orig_size=$$(stat -f%z "$$file" 2>/dev/null || stat -c%s "$$file"); \
				new_size=$$(stat -f%z "$$output" 2>/dev/null || stat -c%s "$$output"); \
				savings=$$(( (orig_size - new_size) * 100 / orig_size )); \
				echo "  ✓ $$base → $$name.webp ($${savings}% 절감)"; \
				SUCCESS=$$((SUCCESS + 1)); \
			else \
				echo "  ✗ $$base (변환 실패)"; \
				FAIL=$$((FAIL + 1)); \
			fi; \
		else \
			tmp_jpg="/tmp/_webp_convert_$$$$_$$name.jpg"; \
			if sips -s format jpeg -s formatOptions 100 "$$file" --out "$$tmp_jpg" > /dev/null 2>&1; then \
				if cwebp -q $(QUALITY) -metadata all "$$tmp_jpg" -o "$$output" > /dev/null 2>&1; then \
					orig_size=$$(stat -f%z "$$file" 2>/dev/null || stat -c%s "$$file"); \
					new_size=$$(stat -f%z "$$output" 2>/dev/null || stat -c%s "$$output"); \
					savings=$$(( (orig_size - new_size) * 100 / orig_size )); \
					echo "  ✓ $$base → $$name.webp (RAW→WebP, $${savings}% 절감)"; \
					SUCCESS=$$((SUCCESS + 1)); \
				else \
					echo "  ✗ $$base (cwebp 변환 실패)"; \
					FAIL=$$((FAIL + 1)); \
				fi; \
			else \
				echo "  ✗ $$base (sips 변환 실패)"; \
				FAIL=$$((FAIL + 1)); \
			fi; \
			rm -f "$$tmp_jpg"; \
		fi; \
	done < <($(FIND_ORIGINALS)); \
	echo ""; \
	echo "완료! 성공: $$SUCCESS, 실패: $$FAIL"

clean-originals: ## 변환 완료된 원본 삭제
	@count=$$(LC_ALL=C $(FIND_ORIGINALS) | LC_ALL=C tr -cd '\0' | LC_ALL=C wc -c | tr -d ' '); \
	if [ "$$count" = "0" ]; then \
		echo "삭제할 원본 파일이 없습니다."; \
		exit 0; \
	fi; \
	DELETED=0; SKIPPED=0; \
	while IFS= read -r -d '' file; do \
		dir=$$(dirname "$$file"); \
		base=$$(basename "$$file"); \
		name="$${base%.*}"; \
		webp="$$dir/$$name.webp"; \
		if [ -f "$$webp" ]; then \
			rm "$$file"; \
			echo "  🗑 $$base (WebP 존재 확인 후 삭제)"; \
			DELETED=$$((DELETED + 1)); \
		else \
			echo "  ⏭ $$base (WebP 없음, 보존)"; \
			SKIPPED=$$((SKIPPED + 1)); \
		fi; \
	done < <($(FIND_ORIGINALS)); \
	echo ""; \
	echo "삭제: $$DELETED, 보존: $$SKIPPED"
