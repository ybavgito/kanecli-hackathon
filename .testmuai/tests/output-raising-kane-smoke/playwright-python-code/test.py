import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="7ed2bf7c-1fba-4810-89d8-c4478e3b0374",
    name="Verify Raising Kane Branding and Page Elements",
    tc_id="TC-1",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"raising_kane_branding_visible": "true", "merchant_simulated_notice": "true", "order_simulated_notice": "true", "your_request_textbox_visible": "true"},
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:5173', instruction_id='91452e4e-0b00-4255-8eff-45570c1fc802'):
        await page.goto("http://127.0.0.1:5173")
    
    async with testmu.step('Waiting for your request message on Raising Kane homepage', instruction_id='f8289d7b-c4e0-4ee8-a34e-e3e20a66cc17'):
        await page.wait_for_timeout(100)
    
    async with testmu.step('Checking whether the Raising Kane branding is present'):
        set_var('raising_kane_branding_visible', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {2: 0};\n  const el = (i) => els[__m[i]];\n  const __v = ((() => { const r=el(2).getBoundingClientRect(); return /raising\\s*kane/i.test(el(2).textContent) && !!(r.width||r.height); })());\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Raising Kane home"i]'], query='whether the Raising Kane branding is present (in the page header)', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the Raising Kane branding is visible'))
    
    async with testmu.step('Checking whether a merchant simulation statement is present'):
        set_var('merchant_simulated_notice', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {28: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (/fictional merchant/i.test(el(28).textContent));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="Demo environmentThis flow"i'], query='whether a statement that the merchant is simulated is present (in the demo-environment notice)', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the page clearly says the merchant is simulated'))
    
    async with testmu.step('Checking whether an order simulation statement is present'):
        set_var('order_simulated_notice', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {28: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (/simulated order/i.test(el(28).textContent));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="Demo environmentThis flow"i'], query='whether a statement that the order is simulated is present (in the demo-environment notice)', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the page clearly says the order is simulated'))
    
    async with testmu.step('whether the Your request textbox is present (in the start-return form)', instruction_id='2148b0d5-fed8-4637-b279-ba33269112fe'):
        set_var('your_request_textbox_visible', await testmu.vision_query(page, "whether the Your request textbox is present (in the start-return form)", ""))
    
    async with testmu.step('Assertion check', instruction_id='91daa6c5-b386-4064-bd17-0c686f7afecf'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the Raising Kane branding is visible', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{raising_kane_branding_visible}}', 'store_key': 'raising_kane_branding_visible', 'variable_refs': {'{{raising_kane_branding_visible}}': 'true'}}, {'description': 'the Your request textbox is visible', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{your_request_textbox_visible}}', 'store_key': 'your_request_textbox_visible', 'variable_refs': {'{{your_request_textbox_visible}}': 'true'}}], 'sub_checks': [{'description': 'the Raising Kane branding is visible', 'store_key': 'raising_kane_branding_visible', 'expected_value': 'true', 'extracted_value': '{{raising_kane_branding_visible}}', 'operator': 'equals', 'transforms': []}, {'description': 'the Your request textbox is visible', 'store_key': 'your_request_textbox_visible', 'expected_value': 'true', 'extracted_value': '{{your_request_textbox_visible}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the Raising Kane branding and Your request textbox are visible'})
    
    async with testmu.step('Assertion check', instruction_id='674c12bc-6c29-4b54-a57a-e5acc62ef1a8'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the page clearly says the merchant is simulated', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{merchant_simulated_notice}}', 'store_key': 'merchant_simulated_notice', 'variable_refs': {'{{merchant_simulated_notice}}': 'true'}}, {'description': 'the page clearly says the order is simulated', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{order_simulated_notice}}', 'store_key': 'order_simulated_notice', 'variable_refs': {'{{order_simulated_notice}}': 'true'}}], 'sub_checks': [{'description': 'the page clearly says the merchant is simulated', 'store_key': 'merchant_simulated_notice', 'expected_value': 'true', 'extracted_value': '{{merchant_simulated_notice}}', 'operator': 'equals', 'transforms': []}, {'description': 'the page clearly says the order is simulated', 'store_key': 'order_simulated_notice', 'expected_value': 'true', 'extracted_value': '{{order_simulated_notice}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the page clearly says the merchant and order are simulated'})


if __name__ == "__main__":
    testmu.run(test)