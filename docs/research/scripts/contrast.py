import sys
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
def check(fg,bg,kind):
    r=cr(fg,bg); need={'text':4.5,'large':3.0,'ui':3.0,'deco':1.0}[kind]
    return r, ('PASS' if r>=need else 'FAIL')
if __name__=='__main__':
    failed=False
    for line in sys.stdin:
        line=line.strip()
        if not line or line.startswith('#'): print(line); continue
        parts=[x.strip() for x in line.split('|')]
        # Rows are "label|fg|bg|kind" or, as in final_pairs.txt, "direction|label|fg|bg|kind".
        label=' / '.join(parts[:-3]); fg,bg,kind=parts[-3:]
        r,s=check(fg,bg,kind)
        failed = failed or s=='FAIL'
        print(f"{label:<72} {fg} on {bg}  {r:5.2f}:1  [{kind}] {s}")
    sys.exit(1 if failed else 0)
