import { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileText,
  History,
  Loader2,
  LockKeyhole,
  ScanText,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type FindingStatus = 'Low' | 'Within range' | 'High' | 'Abnormal' | 'Unclear';
type OverallFlag = 'Within range' | 'Review suggested' | 'Prompt review' | 'Unclear';

interface LabAnalysis {
  reportTitle: string;
  reportDate: string;
  overview: string;
  overallFlag: OverallFlag;
  findings: Array<{
    test: string;
    value: string;
    referenceRange: string;
    status: FindingStatus;
    explanation: string;
  }>;
  keyPoints: string[];
  followUpQuestions: string[];
  urgentWarnings: string[];
}

interface SavedLabSummary {
  _id: string;
  report_name: string;
  report_date?: string;
  overview: string;
  overall_flag: OverallFlag;
  created_at: string;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 15;
const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const flagClass = (flag: OverallFlag | FindingStatus) => {
  if (flag === 'Prompt review' || flag === 'High' || flag === 'Abnormal') {
    return 'border-red-500 bg-red-50 text-red-700';
  }
  if (flag === 'Review suggested' || flag === 'Low' || flag === 'Unclear') {
    return 'border-amber-500 bg-amber-50 text-amber-700';
  }
  return 'border-green-600 bg-green-50 text-green-700';
};

export default function VoiceAI() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [analysis, setAnalysis] = useState<LabAnalysis | null>(null);
  const [history, setHistory] = useState<SavedLabSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    try {
      const records = await apiClient.getLabReportHistory();
      setHistory(Array.isArray(records) ? records : []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    document.title = 'Lab Report Summarizer | MediNova';
    loadHistory();
  }, []);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setError('');
    setAnalysis(null);
    setSaved(false);

    if (!selected) return;
    if (!acceptedTypes.includes(selected.type)) {
      setError('Choose a PDF, JPG, PNG, or WebP lab report.');
      event.target.value = '';
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setError('The report must be 10 MB or smaller.');
      event.target.value = '';
      return;
    }

    setFile(selected);
    setSelectedName(selected.name);
  };

  const createOcrWorker = async () => {
    const { createWorker } = await import('tesseract.js');
    return createWorker('eng', 1, {
      logger: (message) => {
      if (message.status === 'recognizing text') {
        setProgress((current) => Math.max(current, 10 + Math.round(message.progress * 55)));
      }
      },
    });
  };

  const extractImageText = async (image: File) => {
    setStage('Reading text from image locally…');
    const worker = await createOcrWorker();
    try {
      const result = await worker.recognize(image);
      return result.data.text;
    } finally {
      await worker.terminate();
    }
  };

  const extractPdfText = async (pdfFile: File) => {
    setStage('Reading PDF pages locally…');
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    const bytes = new Uint8Array(await pdfFile.arrayBuffer());
    const loadingTask = pdfjs.getDocument({ data: bytes });
    const pdfDocument = await loadingTask.promise;
    const pageCount = Math.min(pdfDocument.numPages, MAX_PDF_PAGES);
    const pageTexts: string[] = [];
    let ocrWorker: Awaited<ReturnType<typeof createOcrWorker>> | null = null;

    try {
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        setProgress(5 + Math.round((pageNumber / pageCount) * 50));
        setStage(`Reading PDF page ${pageNumber} of ${pageCount}…`);
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const digitalText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .trim();

        if (digitalText.length >= 30) {
          pageTexts.push(digitalText);
          continue;
        }

        setStage(`Scanning image text on PDF page ${pageNumber}…`);
        if (!ocrWorker) ocrWorker = await createOcrWorker();
        const viewport = page.getViewport({ scale: 1.8 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const result = await ocrWorker.recognize(canvas);
        pageTexts.push(result.data.text);
      }
    } finally {
      await ocrWorker?.terminate();
      await loadingTask.destroy();
    }

    return pageTexts.join('\n\n');
  };

  const analyzeReport = async () => {
    if (!file || busy) return;
    setBusy(true);
    setProgress(3);
    setError('');
    setAnalysis(null);
    setSaved(false);

    try {
      const extractedText = file.type === 'application/pdf'
        ? await extractPdfText(file)
        : await extractImageText(file);

      if (extractedText.trim().length < 40) {
        throw new Error('Very little readable text was found. Try a clearer, well-lit image or a text-based PDF.');
      }

      setProgress(72);
      setStage('Analyzing extracted results securely…');
      const result = await apiClient.analyzeLabReport(selectedName, extractedText);
      setAnalysis(result.analysis);
      setSaved(Boolean(result.savedRecord));
      setProgress(100);
      setStage('Summary saved to your patient record.');
      await loadHistory();
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'The report could not be analyzed.');
    } finally {
      // Release the original file after processing. Only its display name remains in UI state.
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ScanText className="h-7 w-7 text-primary" /> AI Lab Report Summarizer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a PDF or image to extract results, understand flagged values, and save a concise summary for future reference.
        </p>
      </div>

      <Alert>
        <LockKeyhole className="h-4 w-4" />
        <AlertTitle>Your original report is not stored</AlertTitle>
        <AlertDescription>
          PDF and image processing happens in your browser. Only extracted text is sent for analysis, and only the final structured summary is added to your patient record. This tool does not provide a diagnosis.
        </AlertDescription>
      </Alert>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="medical-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UploadCloud className="h-5 w-5" /> Upload lab report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center transition hover:border-primary/60">
              <FileText className="mb-3 h-10 w-10 text-primary" />
              <span className="font-semibold text-foreground">Choose a PDF or report image</span>
              <span className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG or WebP · maximum 10 MB · first 15 PDF pages</span>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={chooseFile}
                className="sr-only"
                disabled={busy}
              />
            </label>

            {selectedName && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <FileCheck2 className="h-4 w-4 text-green-600" />
                <span className="min-w-0 flex-1 truncate">{selectedName}</span>
                {saved && <Badge className="bg-green-600">Summary saved</Badge>}
              </div>
            )}

            {busy && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {stage}
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Could not analyze report</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={analyzeReport} disabled={!file || busy} className="w-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanText className="mr-2 h-4 w-4" />}
              {busy ? 'Processing report' : 'Extract and analyze report'}
            </Button>
          </CardContent>
        </Card>

        <Card className="medical-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Saved summaries</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length ? (
              <div className="space-y-3">
                {history.slice(0, 5).map((record) => (
                  <div key={record._id} className="rounded-xl border bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold">{record.report_name}</div>
                      <Badge variant="outline" className={flagClass(record.overall_flag)}>{record.overall_flag}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{record.overview}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{new Date(record.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No saved lab summaries yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {analysis && (
        <div className="space-y-5">
          {analysis.urgentWarnings.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Prompt clinical review may be needed</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {analysis.urgentWarnings.map((warning, index) => <li key={index}>{warning}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{analysis.reportTitle}</h2>
                  {analysis.reportDate && <p className="text-xs text-muted-foreground">Report date: {analysis.reportDate}</p>}
                </div>
                <Badge variant="outline" className={flagClass(analysis.overallFlag)}>{analysis.overallFlag}</Badge>
              </div>
              <p className="mt-4 text-sm leading-6">{analysis.overview}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {analysis.findings.map((finding, index) => (
              <Card key={`${finding.test}-${index}`} className="medical-card border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{finding.test}</CardTitle>
                    <Badge variant="outline" className={flagClass(finding.status)}>{finding.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Result:</span> <strong>{finding.value || 'Unclear'}</strong></div>
                  <div><span className="text-muted-foreground">Report range:</span> {finding.referenceRange || 'Not shown'}</div>
                  <p className="pt-1 leading-6 text-muted-foreground">{finding.explanation}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="medical-card border-0">
              <CardHeader><CardTitle className="text-lg">Key points</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {analysis.keyPoints.map((point, index) => (
                    <li key={index} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {point}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="medical-card border-0">
              <CardHeader><CardTitle className="text-lg">Questions for your clinician</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {analysis.followUpQuestions.map((question, index) => (
                    <li key={index} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {question}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            AI-generated explanation for informational use only. Confirm all extracted values against the original report and discuss concerns with a qualified clinician.
          </p>
        </div>
      )}
    </div>
  );
}
