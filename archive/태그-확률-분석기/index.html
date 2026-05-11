import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, ArrowRight, BarChart3, Grip, Calculator, FastForward, Search, 
  RefreshCw, Settings2, Wrench, Copy, CheckCircle2, Plus, Trash2, GripVertical, 
  ChevronUp, ChevronDown, Download, Network, GitBranch
} from 'lucide-react';

// --- 파서(Parser) 로직 ---
function parsePattern(str) {
  let pos = 0;
  function parseSequence() {
    let nodes = [];
    let currentText = "";
    while (pos < str.length) {
      let char = str[pos];
      if (char === '{') {
        if (currentText) { nodes.push({ type: 'text', value: currentText }); currentText = ""; }
        pos++; nodes.push(parseChoice());
      } else if (char === '|' || char === '}') {
        break;
      } else {
        currentText += char; pos++;
      }
    }
    if (currentText) nodes.push({ type: 'text', value: currentText });
    return { type: 'sequence', nodes: nodes };
  }
  function parseChoice() {
    let choices = [];
    while (pos < str.length) {
      choices.push(parseSequence());
      if (pos < str.length && str[pos] === '|') { pos++; }
      else if (pos < str.length && str[pos] === '}') { pos++; break; }
    }
    return { type: 'choice', choices: choices };
  }
  return parseSequence();
}

function astToString(ast) {
  if (!ast) return '';
  if (ast.type === 'text') return ast.value;
  if (ast.type === 'sequence') {
    return ast.nodes.map(astToString).join('');
  }
  if (ast.type === 'choice') {
    if (ast.choices.length === 0) return '';
    return '{' + ast.choices.map(astToString).join('|') + '}';
  }
  return '';
}

// --- 분석 및 메트릭 로직 ---
function calculateMetrics(ast) {
  if (ast.type === 'text') return 1;
  if (ast.type === 'sequence') {
    let combos = 1;
    for (let node of ast.nodes) combos *= calculateMetrics(node);
    return combos;
  }
  if (ast.type === 'choice') {
    if (ast.choices.length === 0) return 1;
    let combos = 0;
    for (let choice of ast.choices) combos += calculateMetrics(choice);
    return combos;
  }
  return 1;
}

function evaluateAST(ast) {
  if (ast.type === 'text') return [{ text: ast.value, prob: 1.0 }];
  if (ast.type === 'sequence') {
    let results = [{ text: "", prob: 1.0 }];
    for (let node of ast.nodes) {
      let nodeResults = evaluateAST(node);
      let newResults = [];
      for (let r1 of results) {
        for (let r2 of nodeResults) {
          newResults.push({ text: r1.text + r2.text, prob: r1.prob * r2.prob });
        }
      }
      results = newResults;
    }
    return results;
  }
  if (ast.type === 'choice') {
    let results = [];
    let n = ast.choices.length;
    if (n === 0) return [{ text: "", prob: 1.0 }];
    for (let choice of ast.choices) {
      let choiceResults = evaluateAST(choice);
      for (let res of choiceResults) results.push({ text: res.text, prob: res.prob / n });
    }
    return results;
  }
  return [];
}

function sampleAST(ast) {
  if (ast.type === 'text') return ast.value;
  if (ast.type === 'sequence') {
    return ast.nodes.map(sampleAST).join('');
  }
  if (ast.type === 'choice') {
    if (ast.choices.length === 0) return '';
    const idx = Math.floor(Math.random() * ast.choices.length);
    return sampleAST(ast.choices[idx]);
  }
}

function matchAST(ast, target, pos) {
  const mergeStates = (states) => {
    let map = new Map();
    for (let s of states) {
      map.set(s.nextPos, (map.get(s.nextPos) || 0) + s.prob);
    }
    return Array.from(map.entries()).map(([nextPos, prob]) => ({ nextPos, prob }));
  };

  if (ast.type === 'text') {
    if (target.startsWith(ast.value, pos)) return [{ nextPos: pos + ast.value.length, prob: 1.0 }];
    return [];
  }
  if (ast.type === 'choice') {
    if (ast.choices.length === 0) return [{ nextPos: pos, prob: 1.0 }];
    let allStates = [];
    let probFactor = 1.0 / ast.choices.length;
    for (let choice of ast.choices) {
      let states = matchAST(choice, target, pos);
      for (let s of states) allStates.push({ nextPos: s.nextPos, prob: s.prob * probFactor });
    }
    return mergeStates(allStates);
  }
  if (ast.type === 'sequence') {
    let currentStates = [{ nextPos: pos, prob: 1.0 }];
    for (let node of ast.nodes) {
      let nextStates = [];
      for (let state of currentStates) {
        let subStates = matchAST(node, target, state.nextPos);
        for (let sub of subStates) nextStates.push({ nextPos: sub.nextPos, prob: state.prob * sub.prob });
      }
      currentStates = mergeStates(nextStates);
      if (currentStates.length === 0) break;
    }
    return currentStates;
  }
  return [];
}

// --- 트리 렌더링 컴포넌트 ---
const ASTNodeRenderer = ({ node, isRoot = false }) => {
  if (!node) return null;

  if (node.type === 'text') {
    const isBlank = node.value === '';
    return (
      <div className={`px-3 py-2 rounded-xl text-sm font-mono whitespace-pre shadow-sm border flex-shrink-0 ${isBlank ? 'bg-slate-100 border-slate-200 text-slate-400 italic' : 'bg-white border-emerald-200 text-emerald-800 font-medium'}`}>
        {isBlank ? '[공백]' : node.value}
      </div>
    );
  }

  if (node.type === 'sequence') {
    // 공백 분기의 경우 명시적으로 [공백] 블록 렌더링
    if (node.nodes.length === 0) {
      return (
        <div className="px-3 py-2 rounded-xl text-sm font-mono whitespace-pre shadow-sm border flex-shrink-0 bg-slate-100 border-slate-200 text-slate-400 italic">
          [공백]
        </div>
      );
    }
    // 시퀀스 내에 노드가 하나뿐이면 불필요한 껍데기를 벗김
    if (node.nodes.length === 1) return <ASTNodeRenderer node={node.nodes[0]} isRoot={isRoot} />;

    return (
      <div className={`flex flex-nowrap items-center gap-2 ${isRoot ? 'min-w-max p-2' : 'bg-slate-50 border border-slate-200 rounded-2xl p-2.5 shadow-sm min-w-max'}`}>
        {node.nodes.map((child, idx) => (
          <React.Fragment key={idx}>
            <ASTNodeRenderer node={child} />
            {idx < node.nodes.length - 1 && <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (node.type === 'choice') {
    if (node.choices.length === 0) return null;
    if (node.choices.length === 1) return <ASTNodeRenderer node={node.choices[0]} />;

    return (
      <div className="flex flex-col gap-2 p-3 bg-indigo-50/50 border border-indigo-200 rounded-2xl min-w-max shadow-sm">
        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1 flex items-center gap-1.5 mb-1">
          <GitBranch className="w-3.5 h-3.5" />
          확률적 분기점 ({node.choices.length}가지 경로)
        </div>
        <div className="flex flex-col gap-2.5">
          {node.choices.map((child, idx) => (
            <div key={idx} className="flex items-stretch gap-2">
              <div className="w-4 border-l-2 border-b-2 border-indigo-300 rounded-bl-xl mb-4 mt-2 ml-1"></div>
              <div className="flex-1 min-w-max">
                <ASTNodeRenderer node={child} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// --- 메인 앱 컴포넌트 ---
export default function App() {
  const [inputText, setInputText] = useState('{fucked silly, |orgasm, |grin, |evil grin, |crying, |happy, |}{blush, {nose blush, |}}{open mouth, {heavy breathing, |clenched teeth, |closed mouth, |}{tongue, tongue out,  |}{saliva, {saliva trail, {saliva trail between teeth, |}|}{drooling, {mouth drool, |}|}|}|}{{closed eyes, |one eye closed, |wide-eyed, |empty eyes, {partially shaded face, |}|{@_@, |ringed eyes, }|}{dashed eyes, |}{tears, {teardrop, |}|}{half-closed eyes, |}{rolling eyes, |}}{heart-shaped pupils, |}{^^^, twitching, |trembling, |}{steaming body, |}{sweat, {sweatdrop, |}|}{heart, |heart, spoken heart, |}{!?, |!?, spoken interrobang, |}{sound effects, |}{messy hair, |}{wet, {wet hair, |}|}{wet hair, |}');
  
  const [activeTab, setActiveTab] = useState('builder'); // 'forward' | 'reverse' | 'builder' | 'tree'
  const [error, setError] = useState(null);
  
  // 순방향 연산 상태
  const [results, setResults] = useState([]);
  const [totalCombos, setTotalCombos] = useState(0);
  const [isSampled, setIsSampled] = useState(false);
  const MAX_EXHAUSTIVE = 15000;
  
  // 역방향 연산 상태
  const [reverseTarget, setReverseTarget] = useState('happy, blush, nose blush, open mouth, closed eyes, tears, teardrop, heart-shaped pupils, sweat, messy hair, wet, wet hair, ');
  const [reverseProb, setReverseProb] = useState(null);

  // 시각적 빌더 상태
  const [builderBlocks, setBuilderBlocks] = useState([
    { id: 'b1', name: '표정', choices: [{ id: 'c1', text: 'happy, ', weight: 1 }, { id: 'c2', text: 'crying, ', weight: 1 }, { id: 'c3', text: '', weight: 1 }] },
    { id: 'b2', name: '홍조 (중첩 가능)', choices: [{ id: 'c4', text: 'blush, {nose blush, |}', weight: 1 }, { id: 'c5', text: '', weight: 1 }] },
    { id: 'b3', name: '머리상태', choices: [{ id: 'c6', text: 'messy hair, ', weight: 2 }, { id: 'c7', text: '', weight: 1 }] }
  ]);
  const [draggedBlockIdx, setDraggedBlockIdx] = useState(null);
  const [dragOverBlockIdx, setDragOverBlockIdx] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // 가져오기 (Import) 상태
  const [importText, setImportText] = useState('');

  // 현재 텍스트 패턴의 구문 트리 (Tree 다이어그램용)
  const currentAST = useMemo(() => {
    try {
      if (!inputText.trim()) return null;
      const openCount = (inputText.match(/\{/g) || []).length;
      const closeCount = (inputText.match(/\}/g) || []).length;
      if (openCount !== closeCount) return null;
      return parsePattern(inputText);
    } catch (e) {
      return null;
    }
  }, [inputText]);

  useEffect(() => {
    if (activeTab === 'forward') analyzeTags();
  }, [inputText, activeTab]);

  const validateInput = () => {
    const openCount = (inputText.match(/\{/g) || []).length;
    const closeCount = (inputText.match(/\}/g) || []).length;
    if (openCount !== closeCount) {
      setError(`오류: 열린 괄호 '{' (${openCount}개)와 닫힌 괄호 '}' (${closeCount}개)의 짝이 맞지 않습니다.`);
      return false;
    }
    return true;
  };

  const analyzeTags = () => {
    setError(null);
    if (!inputText.trim() || !validateInput()) {
      setResults([]); setTotalCombos(0); return;
    }

    try {
      const ast = parsePattern(inputText);
      const combos = calculateMetrics(ast);
      setTotalCombos(combos);

      if (combos > MAX_EXHAUSTIVE) {
        setIsSampled(true);
        const SAMPLE_SIZE = 10000;
        let map = new Map();
        for (let i = 0; i < SAMPLE_SIZE; i++) {
          const res = sampleAST(ast);
          map.set(res, (map.get(res) || 0) + 1);
        }
        let aggregated = Array.from(map.entries()).map(([text, count]) => ({
          text, prob: count / SAMPLE_SIZE
        }));
        aggregated.sort((a, b) => b.prob - a.prob);
        setResults(aggregated.slice(0, 200));
      } else {
        setIsSampled(false);
        const rawResults = evaluateAST(ast);
        let map = new Map();
        for (let res of rawResults) map.set(res.text, (map.get(res.text) || 0) + res.prob);
        let aggregated = Array.from(map.entries()).map(([text, prob]) => ({ text, prob }));
        aggregated.sort((a, b) => b.prob - a.prob);
        setResults(aggregated);
      }
    } catch (e) {
      setError("구문 분석 중 오류가 발생했습니다. 패턴 형식을 확인해주세요.");
    }
  };

  const calculateReverse = () => {
    setError(null);
    if (!inputText.trim() || !validateInput()) return;
    
    try {
      const ast = parsePattern(inputText);
      const states = matchAST(ast, reverseTarget, 0);
      const validMatches = states.filter(s => s.nextPos === reverseTarget.length);
      const finalProb = validMatches.reduce((sum, s) => sum + s.prob, 0);
      setReverseProb(finalProb);
    } catch (e) {
      setError("역방향 계산 중 오류가 발생했습니다.");
    }
  };

  const formatProb = (prob, isExact = false) => {
    if (prob === 0) return "0%";
    if (prob < 0.000001) return isExact ? prob.toExponential(4) : "< 0.0001%";
    return (prob * 100).toFixed(4) + "%";
  };

  // --- 빌더 기능 로직 ---
  const generateBuilderString = () => {
    return builderBlocks.map(block => {
      let parts = [];
      block.choices.forEach(choice => {
        const weight = Math.max(0, parseInt(choice.weight) || 0);
        for(let i=0; i<weight; i++) {
          parts.push(choice.text);
        }
      });
      if (parts.length === 0) return "";
      if (parts.length === 1) return parts[0];
      return `{${parts.join('|')}}`;
    }).join('');
  };

  const handleCopyBuilder = () => {
    const pattern = generateBuilderString();
    try {
      navigator.clipboard.writeText(pattern);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch(err) {
      const textArea = document.createElement("textarea");
      textArea.value = pattern;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const applyBuilderToMain = (targetTab) => {
    setInputText(generateBuilderString());
    setActiveTab(targetTab);
  };

  const handleImportBuilder = () => {
    if (!importText.trim()) return;

    const openCount = (importText.match(/\{/g) || []).length;
    const closeCount = (importText.match(/\}/g) || []).length;
    if (openCount !== closeCount) {
      alert(`오류: 열린 괄호 '{' (${openCount}개)와 닫힌 괄호 '}' (${closeCount}개)의 짝이 맞지 않습니다.`);
      return;
    }

    try {
      const ast = parsePattern(importText);
      let nodesToProcess = [];
      if (ast.type === 'sequence') {
          nodesToProcess = ast.nodes;
      } else {
          nodesToProcess = [ast];
      }

      const newBlocks = [];
      nodesToProcess.forEach((node, bIdx) => {
          if (node.type === 'text') {
              newBlocks.push({
                  id: `b_${Date.now()}_${bIdx}`,
                  name: `고정 텍스트`,
                  choices: [{ id: `c_${Date.now()}_${bIdx}_1`, text: node.value, weight: 1 }]
              });
          } else if (node.type === 'choice') {
              const counts = new Map();
              node.choices.forEach(choiceAst => {
                  const str = astToString(choiceAst);
                  counts.set(str, (counts.get(str) || 0) + 1);
              });

              const blockChoices = Array.from(counts.entries()).map(([text, weight], cIdx) => ({
                  id: `c_${Date.now()}_${bIdx}_${cIdx}`,
                  text: text,
                  weight: weight
              }));

              newBlocks.push({
                  id: `b_${Date.now()}_${bIdx}`,
                  name: `태그 그룹 ${bIdx + 1}`,
                  choices: blockChoices
              });
          }
      });
      setBuilderBlocks(newBlocks);
      setImportText('');
    } catch (err) {
      alert("패턴을 해석하는 중 오류가 발생했습니다.");
    }
  };

  // DND Handlers (버그 픽스: setData 추가)
  const handleDragStart = (e, idx) => { 
    setDraggedBlockIdx(idx); 
    e.dataTransfer.effectAllowed = 'move'; 
    e.dataTransfer.setData('text/plain', idx.toString()); 
  };
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverBlockIdx(idx); };
  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (draggedBlockIdx === null || draggedBlockIdx === idx) { setDragOverBlockIdx(null); return; }
    const newBlocks = [...builderBlocks];
    const [moved] = newBlocks.splice(draggedBlockIdx, 1);
    newBlocks.splice(idx, 0, moved);
    setBuilderBlocks(newBlocks);
    setDraggedBlockIdx(null); setDragOverBlockIdx(null);
  };
  
  const moveBlock = (idx, direction) => {
    if ((direction === -1 && idx === 0) || (direction === 1 && idx === builderBlocks.length - 1)) return;
    const newBlocks = [...builderBlocks];
    const temp = newBlocks[idx];
    newBlocks[idx] = newBlocks[idx + direction];
    newBlocks[idx + direction] = temp;
    setBuilderBlocks(newBlocks);
  };

  const addBlock = () => {
    setBuilderBlocks([...builderBlocks, { 
      id: `b${Date.now()}`, name: '새 태그 그룹', 
      choices: [{ id: `c${Date.now()}1`, text: 'tag, ', weight: 1 }, { id: `c${Date.now()}2`, text: '', weight: 1 }] 
    }]);
  };
  const updateBlock = (blockIdx, field, value) => {
    const newBlocks = [...builderBlocks];
    newBlocks[blockIdx][field] = value;
    setBuilderBlocks(newBlocks);
  };
  const removeBlock = (blockIdx) => {
    const newBlocks = [...builderBlocks];
    newBlocks.splice(blockIdx, 1);
    setBuilderBlocks(newBlocks);
  };
  const addChoice = (blockIdx) => {
    const newBlocks = [...builderBlocks];
    newBlocks[blockIdx].choices.push({ id: `c${Date.now()}`, text: '', weight: 1 });
    setBuilderBlocks(newBlocks);
  };
  const updateChoice = (blockIdx, choiceIdx, field, value) => {
    const newBlocks = [...builderBlocks];
    newBlocks[blockIdx].choices[choiceIdx][field] = value;
    setBuilderBlocks(newBlocks);
  };
  const removeChoice = (blockIdx, choiceIdx) => {
    const newBlocks = [...builderBlocks];
    newBlocks[blockIdx].choices.splice(choiceIdx, 1);
    setBuilderBlocks(newBlocks);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">대규모 태그 확률 계산기 & 빌더</h1>
          </div>
          <p className="text-slate-600">
            복잡한 확률적 태그(`{"{A|B}"}`)를 시각적으로 조립하거나 분석할 수 있는 종합 툴셋입니다.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveTab('builder')}
            className={`px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'builder' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
          >
            <Wrench className="w-5 h-5" /> 시각적 태그 빌더
          </button>
          <button 
            onClick={() => setActiveTab('tree')}
            className={`px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'tree' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
          >
            <Network className="w-5 h-5" /> 트리 다이어그램
          </button>
          <button 
            onClick={() => setActiveTab('forward')}
            className={`px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'forward' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
          >
            <FastForward className="w-5 h-5" /> 순방향 (결과예측)
          </button>
          <button 
            onClick={() => setActiveTab('reverse')}
            className={`px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'reverse' ? 'bg-pink-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
          >
            <Search className="w-5 h-5" /> 역방향 (확률역산)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* === 빌더 탭 UI === */}
          {activeTab === 'builder' && (
            <div className="lg:col-span-12 space-y-6">
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 block">Live Preview</span>
                  <div className="font-mono text-sm bg-white border border-emerald-200 p-4 rounded-xl break-all text-slate-700 shadow-inner min-h-[4rem]">
                    {generateBuilderString() || <span className="text-slate-300 italic">패턴이 비어있습니다.</span>}
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2 w-full lg:w-auto">
                  <button 
                    onClick={handleCopyBuilder}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl font-bold transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? "복사됨!" : "클립보드 복사"}
                  </button>
                  <button 
                    onClick={() => applyBuilderToMain('tree')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-sm"
                  >
                    <Network className="w-5 h-5" /> 트리 보기
                  </button>
                  <button 
                    onClick={() => applyBuilderToMain('forward')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-sm"
                  >
                    <FastForward className="w-5 h-5" /> 분석하기
                  </button>
                </div>
              </div>

              {/* 외부 패턴 가져오기 UI */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="외부 태그 패턴 붙여넣기 (예: {happy, |crying, }{blush, |})"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-mono"
                  />
                </div>
                <button
                  onClick={handleImportBuilder}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-bold transition-colors whitespace-nowrap"
                >
                  <Download className="w-5 h-5" />
                  빌더로 가져오기
                </button>
              </div>

              <div className="space-y-4">
                {builderBlocks.map((block, bIdx) => {
                  const totalWeight = block.choices.reduce((sum, c) => sum + (parseInt(c.weight) || 0), 0);
                  const isDragging = draggedBlockIdx === bIdx;
                  const isDragOver = dragOverBlockIdx === bIdx;

                  return (
                    <div 
                      key={block.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, bIdx)}
                      onDragOver={(e) => handleDragOver(e, bIdx)}
                      onDrop={(e) => handleDrop(e, bIdx)}
                      className={`bg-white rounded-2xl shadow-sm border transition-all ${isDragging ? 'opacity-40 border-dashed border-emerald-400' : 'border-slate-200'} ${isDragOver && draggedBlockIdx !== bIdx ? 'border-t-4 border-t-emerald-500' : ''}`}
                    >
                      <div className="flex items-center border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                        <div className="p-4 cursor-grab active:cursor-grabbing hover:bg-slate-100 text-slate-400 rounded-tl-2xl flex flex-col items-center">
                          <ChevronUp onClick={() => moveBlock(bIdx, -1)} className="w-4 h-4 cursor-pointer hover:text-emerald-600 mb-1" />
                          <GripVertical className="w-5 h-5" />
                          <ChevronDown onClick={() => moveBlock(bIdx, 1)} className="w-4 h-4 cursor-pointer hover:text-emerald-600 mt-1" />
                        </div>
                        <div className="flex-1 p-3">
                          <input 
                            type="text" 
                            value={block.name}
                            onChange={(e) => updateBlock(bIdx, 'name', e.target.value)}
                            placeholder="그룹 이름 (선택사항)"
                            className="bg-transparent font-bold text-slate-700 focus:outline-none focus:border-b-2 focus:border-emerald-500 w-full"
                          />
                        </div>
                        <button onClick={() => removeBlock(bIdx)} className="p-4 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-4 space-y-2">
                        {block.choices.map((choice, cIdx) => {
                          const w = parseInt(choice.weight) || 0;
                          const percent = totalWeight > 0 ? ((w / totalWeight) * 100).toFixed(1) : 0;
                          
                          return (
                            <div key={choice.id} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 group">
                              <input 
                                type="text" 
                                value={choice.text}
                                onChange={(e) => updateChoice(bIdx, cIdx, 'text', e.target.value)}
                                placeholder="태그 입력 (공백 가능)"
                                className="flex-1 min-w-[150px] p-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />
                              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 h-10 w-full md:w-auto">
                                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">가중치</span>
                                <input 
                                  type="number" 
                                  min="0"
                                  value={choice.weight}
                                  onChange={(e) => updateChoice(bIdx, cIdx, 'weight', e.target.value)}
                                  className="w-16 p-1 text-center font-bold text-slate-700 focus:outline-none"
                                />
                              </div>
                              <div className="w-20 text-right pr-2 font-bold text-emerald-600 text-sm hidden md:block">
                                {percent}%
                              </div>
                              <button onClick={() => removeChoice(bIdx, cIdx)} className="p-2 text-slate-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                        <button onClick={() => addChoice(bIdx)} className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 py-2 px-3 hover:bg-emerald-50 rounded-lg transition-colors">
                          <Plus className="w-4 h-4" /> 선택지 추가
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button 
                  onClick={addBlock}
                  className="w-full py-4 border-2 border-dashed border-emerald-300 text-emerald-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
                >
                  <Plus className="w-5 h-5" /> 새 태그 그룹 추가
                </button>
              </div>

            </div>
          )}

          {/* === 순방향 / 역방향 / 트리 탭 UI (공통 텍스트 입력부 포함) === */}
          {activeTab !== 'builder' && (
            <>
              <div className="lg:col-span-12 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-700">공통 태그 패턴 입력</span>
                    <Settings2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="p-4 flex flex-col">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-700 font-mono text-sm"
                      spellCheck="false"
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-relaxed">{error}</p>
                  </div>
                )}
              </div>

              {/* === 트리 다이어그램 UI === */}
              {activeTab === 'tree' && (
                <div className="lg:col-span-12 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
                      <span className="font-semibold text-sm text-blue-800">태그 패턴 트리 구조</span>
                      <p className="text-xs text-blue-600 mt-1">입력된 패턴이 어떤 순서와 분기로 결합하는지 직관적으로 보여줍니다. (가로 스크롤 가능)</p>
                    </div>
                    <div className="p-6 overflow-x-auto bg-slate-50/50 min-h-[300px]">
                      {currentAST ? (
                        <ASTNodeRenderer node={currentAST} isRoot={true} />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                          <Network className="w-12 h-12 mb-3 opacity-20" />
                          <p>유효한 패턴을 입력하시면 트리가 그려집니다.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'forward' && (
                <div className="lg:col-span-12">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-700">생성 가능한 결과 목록</span>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                          총 경우의 수: {totalCombos.toLocaleString()}개
                        </span>
                        {isSampled && (
                          <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> 10,000회 무작위 샘플링
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 overflow-y-auto max-h-[500px] flex-1">
                      {isSampled && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <p>
                            경우의 수가 너무 많아(15,000개 초과) 브라우저 보호를 위해 <strong>전체 연산 대신 무작위 추출(샘플링) 방식</strong>으로 10,000개의 결과를 임의로 뽑아 분포도를 만들었습니다. (결과는 상위 200개만 표시되며, 아래 표시된 확률은 추정치입니다.)
                          </p>
                        </div>
                      )}

                      {results.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {results.map((result, idx) => (
                            <div key={idx} className="group flex flex-col bg-slate-50 border border-slate-100 rounded-xl p-3 hover:border-indigo-300 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                                <span className="text-sm font-bold text-slate-700">{formatProb(result.prob)} {isSampled && '(추정)'}</span>
                              </div>
                              <div className="text-xs font-mono text-slate-600 break-words leading-relaxed h-full">
                                {result.text === "" ? <span className="italic text-slate-400">[공백]</span> : result.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 py-12">로딩 중이거나 결과가 없습니다.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reverse' && (
                <div className="lg:col-span-12 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-pink-50 border-b border-pink-100 px-4 py-3">
                      <span className="font-semibold text-sm text-pink-800">역방향 타겟 문자열 입력</span>
                      <p className="text-xs text-pink-600 mt-1">위의 패턴으로부터 이 문자열이 정확히 만들어질 확률을 연산합니다. 띄어쓰기와 쉼표까지 정확히 일치해야 합니다.</p>
                    </div>
                    <div className="p-4">
                      <textarea
                        value={reverseTarget}
                        onChange={(e) => setReverseTarget(e.target.value)}
                        placeholder="확률을 계산하고 싶은 문자열을 입력하세요."
                        className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all resize-none text-slate-700 font-mono text-sm"
                        spellCheck="false"
                      />
                      <button
                        onClick={calculateReverse}
                        className="mt-4 w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Search className="w-5 h-5" />
                        <span>정확한 확률 역산하기</span>
                      </button>
                    </div>
                  </div>

                  {reverseProb !== null && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                      <h3 className="text-slate-500 font-medium mb-4">해당 문자열이 도출될 정확한 확률</h3>
                      <div className="text-5xl font-black text-slate-800 mb-2">
                        {formatProb(reverseProb, true)}
                      </div>
                      <p className="text-slate-400 text-sm font-mono mt-4">
                        수학적 소수점 표기: {reverseProb}
                      </p>
                      {reverseProb === 0 && (
                        <p className="text-red-500 text-sm mt-4 font-medium">
                          해당 문자열은 주어진 패턴 규칙 내에서 생성될 수 없습니다. (오타 또는 띄어쓰기 여백 등을 확인하세요)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}