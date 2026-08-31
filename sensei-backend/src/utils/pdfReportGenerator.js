import PDFDocument from 'pdfkit';

export async function generatePDFReport({ sessionId, jobRole, company, scores, overallVerdict, strengths, improvements, weeklyActionPlan, readinessLevel, companyFitScore, recommendedRoles, keyLearningResources }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a237e')
        .text('SENSEI Interview Report', { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica').fillColor('#666')
        .text(`Session: ${sessionId}`, { align: 'center' });
      doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
      doc.moveDown(0.3);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#1a237e');
      doc.moveDown(0.8);

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333')
        .text(`Role: ${jobRole}`);
      doc.text(`Company: ${company}`);

      const readinessColors = { ready: '#4caf50', almost_ready: '#ff9800', needs_work: '#f44336', not_ready: '#9e9e9e' };
      const readinessLabels = { ready: 'Ready', almost_ready: 'Almost Ready', needs_work: 'Needs Work', not_ready: 'Not Ready' };
      doc.fontSize(12).fillColor(readinessColors[readinessLevel] || '#666')
        .text(`Readiness: ${readinessLabels[readinessLevel] || readinessLevel}`);

      if (companyFitScore != null) {
        doc.fillColor('#333').text(`Company Fit Score: ${companyFitScore}%`);
      }
      doc.moveDown(1);

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a237e').text('Scores');
      doc.moveDown(0.3);

      const scoreEntries = [
        ['Technical', scores?.technical],
        ['Communication', scores?.communication],
        ['Confidence', scores?.confidence],
        ['Eye Contact', scores?.eyeContact],
        ['Posture', scores?.posture],
        ['Fluency', scores?.fluency],
        ['Overall', scores?.overall]
      ];

      scoreEntries.forEach(([label, value]) => {
        const pct = Math.round((value || 0) * 100);
        doc.fontSize(10).font('Helvetica').fillColor('#333')
          .text(`${label}: ${pct}%`, 50, doc.y, { continued: false });

        const barY = doc.y - 12;
        const barWidth = 200;
        const fillWidth = barWidth * (value || 0);

        doc.save();
        doc.rect(250, barY, barWidth, 10).fill('#e0e0e0');
        const barColor = pct >= 70 ? '#4caf50' : pct >= 40 ? '#ff9800' : '#f44336';
        doc.rect(250, barY, fillWidth, 10).fill(barColor);
        doc.restore();
        doc.moveDown(0.2);
      });

      doc.moveDown(0.8);

      if (overallVerdict) {
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a237e').text('Verdict');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica').fillColor('#333').text(overallVerdict);
        doc.moveDown(0.8);
      }

      if (strengths && strengths.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#4caf50').text('Strengths');
        doc.moveDown(0.3);
        strengths.forEach(s => {
          doc.fontSize(10).font('Helvetica').fillColor('#333').text(`  ✅ ${s}`);
        });
        doc.moveDown(0.6);
      }

      if (improvements && improvements.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#ff9800').text('Areas for Improvement');
        doc.moveDown(0.3);
        improvements.forEach(s => {
          doc.fontSize(10).font('Helvetica').fillColor('#333').text(`  🔶 ${s}`);
        });
        doc.moveDown(0.6);
      }

      if (weeklyActionPlan && weeklyActionPlan.length > 0) {
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a237e').text('4-Week Action Plan');
        doc.moveDown(0.5);

        weeklyActionPlan.forEach(week => {
          doc.fontSize(12).font('Helvetica-Bold').fillColor('#333')
            .text(`Week ${week.week}: ${week.focus}`);
          doc.moveDown(0.2);
          if (week.tasks) {
            week.tasks.forEach(t => {
              doc.fontSize(9).font('Helvetica').fillColor('#555').text(`    • ${t}`);
            });
          }
          doc.moveDown(0.4);
        });
      }

      if (recommendedRoles && recommendedRoles.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a237e').text('Recommended Alternative Roles');
        doc.moveDown(0.3);
        recommendedRoles.forEach(r => {
          doc.fontSize(10).font('Helvetica').fillColor('#333').text(`  → ${r}`);
        });
      }

      if (keyLearningResources && keyLearningResources.length > 0) {
        doc.moveDown(0.8);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a237e').text('Learning Resources');
        doc.moveDown(0.3);
        keyLearningResources.forEach(r => {
          doc.fontSize(10).font('Helvetica').fillColor('#333')
            .text(`  📚 ${r.title} (${r.type})`, { link: r.url, underline: true });
        });
      }

      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').fillColor('#999')
        .text('Generated by SENSEI Virtual Interview Hub', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default { generatePDFReport };
