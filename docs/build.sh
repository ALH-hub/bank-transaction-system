#!/bin/bash
# LaTeX PDF Report Builder
# Compiles the bank transaction system CFG and coverage documentation to PDF

cd "$(dirname "$0")" || exit 1

echo "Building LaTeX PDF Report..."
echo "=============================="

# Clean previous build artifacts
rm -f report.aux report.log report.out report.toc report.bbl report.blg

# First pass: Compile and generate table of contents
echo "First pass: Generating table of contents..."
pdflatex -interaction=nonstopmode report.tex > /dev/null 2>&1

# Second pass: Resolve references
echo "Second pass: Resolving references..."
pdflatex -interaction=nonstopmode report.tex > /dev/null 2>&1

# Check if PDF was created
if [ -f report.pdf ]; then
    echo ""
    echo "✓ PDF Report Generated Successfully!"
    echo "======================================"
    ls -lh report.pdf
    echo ""
    echo "Report Details:"
    pdfinfo report.pdf 2>/dev/null | grep -E "^(Pages|File size|Title|Author)"
    echo ""
    echo "Location: $(pwd)/report.pdf"
else
    echo "✗ Error: PDF generation failed"
    echo "Check report.log for details"
    exit 1
fi
