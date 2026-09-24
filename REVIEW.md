# Portfolio review — September 24, 2026

## Checks passed

- HTML element nesting is balanced; no duplicate IDs.
- All local image, stylesheet, script, favicon, report, and dataset references resolve.
- Every internal section link resolves to an existing ID.
- JavaScript syntax passes Node's syntax check.
- Six JPEG assets and the supplied Citi PNG decode successfully.
- Three PBIX and two XLSX files pass ZIP container integrity checks.
- Named report and dataset copies are byte-identical to the supplied uploads.
- Nine project cards, five certification entries, six report/dataset download links,
  and five graduation gallery photos are retained.
- Citi displays OCT 2025 — OCT 2026.
- LinkedIn is a clickable link; Say hello is an email link.
- All content images have descriptive alternative text. The initially empty modal
  image receives its source and alternative text when a gallery photo is selected.
- ZIP integrity and byte-for-byte correspondence of packaged website files checked.

## Source-level interaction and accessibility review

Reviewed code paths for the mobile menu, Escape/outside-click dismissal, project
filters and result announcements, expandable details, graduation gallery and native
modal, email-copy fallback, scroll progress, and active navigation.
The layout includes phone, tablet, and desktop breakpoints, flexible grids, larger
touch targets, visible keyboard focus, reduced-motion handling, and hover-independent
controls. These are source-level checks, not evidence of successful testing on every
device or browser.

## Verification limits

- Live browser interaction, screenshot/layout checks, 200% zoom behavior, and real
  phone/tablet testing were not available for this static build in this environment.
- CSS was reviewed as source; no standalone CSS parser was available.
- Both Kaggle dataset URLs returned their expected page titles in web retrieval.
  This does not verify dataset downloads or account-dependent actions.
- GitHub, Coursera, LinkedIn, and Tableau destinations could not be verified because
  retrieval was disabled or inaccessible. This does not establish that they are broken.
- PBIX integrity is container-level only. Reports were not executed in Power BI;
  DAX, visual behavior, refresh credentials, and report calculations are unverified.
- Employment, metrics, and credentials use supplied portfolio information. AWS has
  no verification URL in the supplied content; certification authenticity is unverified.

## Citi photo update

- Added the supplied photo beside the Citi experience on desktop and below it on mobile.
- Preserved the full image proportions and original file bytes.
- Added an accessible full-size viewer, descriptive alternative text, and lazy loading.

## Content corrections already included

- Citi end month updated to October 2026 as requested.
- British Airways project framed as independent analysis; unsupported claims of
  client implementation and business-outcome improvements removed.
- Amazon price × rating-count metric described as an exploratory proxy, not revenue.
- BE3 testing-role count corrected to four to match the listed roles.
- Gallery descriptions adjusted to the supplied images.

## External link inventory

- https://coursera.org/verify/professional-cert/69L1G8SYQ88P
- https://coursera.org/verify/professional-cert/P2NXGPOOWPXV
- https://coursera.org/verify/professional-cert/QGIKVBSMV78C
- https://coursera.org/verify/professional-cert/VRGFI7D1HC40
- https://github.com/KeigoDev
- https://github.com/KeigoDev/File_Converter#-pdf-to-word-converter
- https://github.com/KeigoDev/Ngram---Statistical-Language-Modeling
- https://github.com/KeigoDev/Python-Cleaning-Visualization-JPChase#-bank-branch-deposit-analysis-20102016
- https://github.com/KeigoDev/SQL-Amazon#amazon-product-insights--customer-experience-optimization-project
- https://public.tableau.com/views/AirwayDashboardByKeigo/Dashboard1?:language=en-US&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link
- https://public.tableau.com/views/AmazonInsights_17589781396940/Dashboard1?:language=en-US&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link
- https://www.kaggle.com/datasets/chasebank/bank-deposits
- https://www.kaggle.com/datasets/karkavelrajaj/amazon-sales-dataset
- https://www.linkedin.com/in/matthew-ferrer-profile/
