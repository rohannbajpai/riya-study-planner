import React, { useState } from 'react';
import './index.css';
import pdfToText from 'react-pdftotext';

const App = () => {
  const [tests, setTests] = useState([]);
  const [newTest, setNewTest] = useState({ name: '', date: '', studyGuide: '' });
  const [apiKey, setApiKey] = useState('');
  const [studyPlan, setStudyPlan] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTest({ ...newTest, [name]: value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      pdfToText(file)
        .then(text => {
          setNewTest({ ...newTest, studyGuide: text });
        })
        .catch(error => {
          console.error("Failed to extract text from pdf", error);
          setError('Failed to extract text from PDF.');
        });
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const addTest = () => {
    if (newTest.name && newTest.date && newTest.studyGuide) {
      setTests([...tests, newTest]);
      setNewTest({ name: '', date: '', studyGuide: '' });
    }
  };

  const generateStudyPlan = async () => {
    if (tests.length === 0) {
      setError('Please add at least one test before generating a study plan.');
      return;
    }

    if (!apiKey) {
      setError('Please enter your OpenAI API key.');
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant that creates study plans.'
            },
            {
              role: 'user',
              content: `Create a study plan for the following tests:
                ${tests.map(test => `
                  Test: ${test.name}
                  Date: ${test.date}
                  Study Guide: ${test.studyGuide.substring(0, 1000)}...
                `).join('\n')}
                Please provide a day-by-day plan leading up to the latest test date.`
            }
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      setStudyPlan(data.choices[0].message.content);
      setError('');
    } catch (error) {
      console.error('Detailed error:', error);
      setError(`Error generating study plan: ${error.message}. Please check your API key and try again.`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Study Planner</h1>
      
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-4">Add New Test</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="testName">
            Test Name
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="testName"
            type="text"
            name="name"
            value={newTest.name}
            onChange={handleInputChange}
            placeholder="Test Name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="testDate">
            Test Date
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="testDate"
            type="date"
            name="date"
            value={newTest.date}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studyGuide">
            Study Guide (PDF or TXT File Upload)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="studyGuide"
            type="file"
            onChange={handleFileUpload}
            accept=".pdf"
          />
        </div>
        <button 
          onClick={addTest}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Add Test
        </button>
      </div>

      {tests.length > 0 && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-semibold mb-4">Added Tests</h2>
          {tests.map((test, index) => (
            <div key={index} className="mb-2">
              <strong>{test.name}</strong> - {test.date} - Study Guide Uploaded
            </div>
          ))}
        </div>
      )}

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-4">Generate Study Plan</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="apiKey">
            OpenAI API Key
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
          />
        </div>
        <button 
          onClick={generateStudyPlan}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Generate Study Plan
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {studyPlan && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
          <h2 className="text-xl font-semibold mb-4">Your Study Plan</h2>
          <pre className="whitespace-pre-wrap">{studyPlan}</pre>
        </div>
      )}
    </div>
  );
};

export default App;