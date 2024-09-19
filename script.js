document.addEventListener("DOMContentLoaded", function () {
  var quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline'],    // Стандартные стили текста
        [{ 'color': [] }, { 'background': [] }],  // Параметры цвета текста и фона
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],                   // Вставка ссылки и изображения
        ['clean']                             // Очистить форматирование
      ]
    }
  })

  var outputContainer = document.getElementById('output-container')
  var currentView = 'html' // По умолчанию выбрана вкладка HTML

  var imageLinkInput = document.getElementById('image-link')
  var copyImageLinkBtn = document.getElementById('copy-image-link-btn')

  // Получаем значения из инпутов для картинок
  function getImageSettings() {
    const imageUrl = document.getElementById('image-url').value || 'urlhere'
    const imageWidth = document.getElementById('image-width').value || '450'
    const imageAlt = document.getElementById('image-alt').value || 'image'
    return { imageUrl, imageWidth, imageAlt }
  }

  // Функция для получения ссылки на изображение
  function updateImageLink() {
    var html = quill.root.innerHTML

    // Ищем изображение в контенте
    const imgMatch = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/)
    if (imgMatch) {
      imageLinkInput.value = imgMatch[1] // Выводим ссылку на изображение
    } else {
      imageLinkInput.value = "No images" // Если картинка не найдена
    }
  }

  // Копирование ссылки на изображение
  copyImageLinkBtn.addEventListener('click', function () {
    if (imageLinkInput.value !== "No images") {
      imageLinkInput.select()
      document.execCommand("copy")
    }
  })

  // Обновляем ссылку при изменении контента
  quill.on('text-change', updateImageLink)

  // Первоначальная проверка
  updateImageLink()

  document.getElementById('get-html-btn').addEventListener('click', function () {
    var html = quill.root.innerHTML

    // Применяем всю логику для HTML-версии
    html = processHtml(html)

    // Определяем структуру: с картинкой или без
    if (html.includes('<img')) {
      html = wrapWithImageStructure(html) // Структура с картинкой
    } else {
      html = wrapInTableStructure(html) // Обычная структура без картинки
    }

    // Финальная проверка перед выводом
    html = finalCleanup(html)

    // Форматирование HTML с использованием Prism.js
    var formattedHtml = Prism.highlight(html, Prism.languages.html, 'html')

    // Добавляем подсвеченный код в контейнер с использованием <pre><code>
    outputContainer.innerHTML = `<pre class="line-numbers"><code class="language-html">${formattedHtml}</code></pre>`

    // Обновляем стиль для вывода
    outputContainer.style.overflowY = 'scroll'
    outputContainer.style.overflowX = 'auto'
    currentView = 'html'  // Устанавливаем текущую вкладку как 'html'
  })



  // Функция для предварительного просмотра (Preview)
  document.getElementById('preview-btn').addEventListener('click', function () {
    var html = quill.root.innerHTML

    // Применяем всю логику для preview
    html = processHtml(html)

    // Определяем структуру: с картинкой или без
    if (html.includes('<img')) {
      html = wrapWithImageStructure(html) // Структура с картинкой
    } else {
      html = wrapInTableStructure(html) // Обычная структура без картинки
    }

    // Финальная проверка перед выводом
    html = finalCleanup(html)

    outputContainer.innerHTML = html  // Отображаем результат в виде HTML (Preview)
    currentView = 'preview'  // Устанавливаем текущую вкладку как 'preview'
  })

  // Подключаем слушатель для кнопки MJML
  document.getElementById('get-mjml-btn').addEventListener('click', function () {
    var html = quill.root.innerHTML

    // Обрабатываем HTML для MJML
    html = processHtml(html)

    // Определяем структуру: с картинкой или без
    if (html.includes('<img')) {
      html = wrapWithImageStructureMJML(html) // Структура с картинкой для MJML
    } else {
      html = wrapInTableStructureMJML(html) // Обычная структура без картинки для MJML
    }

    // Применяем форматирование MJML-кода
    const formattedMJML = html_beautify(html, {
      indent_size: 2, // Размер табуляции
      wrap_line_length: 80, // Максимальная длина строки перед переносом
      preserve_newlines: true, // Сохраняем новые строки
      max_preserve_newlines: 2, // Максимум двух пустых строк подряд
      unformatted: ['code', 'pre'] // Теги, которые не форматируются
    })

    // Выводим форматированный MJML код в контейнер
    outputContainer.textContent = formattedMJML
    currentView = 'mjml' // Устанавливаем текущую вкладку как 'mjml'

    // Применяем стили для вывода
    outputContainer.style.fontSize = '14px' // Уменьшаем шрифт для лучшего отображения
    outputContainer.style.overflowX = 'auto' // Добавляем горизонтальный скролл при необходимости
    outputContainer.style.whiteSpace = 'pre-wrap' // Перенос длинных строк
    outputContainer.style.tabSize = '2' // Устанавливаем ширину табуляции
  })


  // Основная функция обработки HTML-кода
  // Основная функция обработки HTML-кода
  function processHtml(html) {
    // Убираем все <br>, заменяем </p> на <br><br>, убираем <p>
    html = html.replace(/<br\s*\/?>/g, '')
    html = html.replace(/<\/p>/g, '<br><br>')
    html = html.replace(/<p>/g, '')


    // Массив допустимых цветов
    const allowedColors = [
      "#CFE2F3", "rgb(207, 226, 243)", "#9FC5E8", "rgb(159, 197, 232)",
      "#6FA8DC", "rgb(111, 168, 220)", "#3D85C6", "rgb(61, 133, 198)",
      "#0B5394", "rgb(11, 83, 148)", "#073763", "rgb(7, 55, 99)",
      "#4A86E8", "rgb(74, 134, 232)", "#C9DAF8", "rgb(201, 218, 248)",
      "#A4C2F4", "rgb(164, 194, 244)", "#6D9EEB", "rgb(109, 158, 235)",
      "#1155CC", "rgb(17, 85, 204)", "#1C4587", "rgb(28, 69, 135)",
      "#3C78D8", "rgb(60, 120, 216)", "rgb(17, 85, 204)", "rgb(0, 0, 255)", "rgb(51, 51, 255)", "rgb(0, 71, 178)"
    ]

    // Конструируем регулярное выражение для проверки цвета
    const colorRegex = new RegExp(`color:\\s*(?:${allowedColors.map(color => color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'i')

    // Проверяем и заменяем теги <a> с допустимым цветом на вашу ссылку
    html = html.replace(/<a[^>]*href=["']http[^"']+["'][^>]*style=["'][^"']*(color:\s*[^;"']+)[^"']*["'][^>]*>(.*?)<\/a>/gi, function (match, styleAttr, content) {
      if (colorRegex.test(styleAttr)) {
        // Заменяем на вашу ссылку
        return `<a href="urlhere" style="font-family:'Roboto', Arial, Helvetica, sans-serif;text-decoration: underline;font-size:18px;font-weight: 700;">${content}</a>`
      }
      return match // Если цвет не подходит, оставляем как есть
    })

    // Регулярное выражение для замены <span> с допустимым цветом на ссылку <a>, включая возможные <em> и <strong>
    html = html.replace(/<span[^>]*style=["'][^"']*(color:\s*[^;"']+);?[^"']*["'][^>]*>(.*?)<\/span>/gi, function (match, styleAttr, content) {
      // Проверяем, если цвет находится в списке допустимых цветов
      if (colorRegex.test(styleAttr)) {
        // Сохраняем <em> и <strong> внутри <span>, если есть
        content = content.replace(/<em[^>]*>(.*?)<\/em>/gi, '<em>$1</em>')
        content = content.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '<strong>$1</strong>')

        // Возвращаем ссылку вместо <span>
        return `<a href="urlhere" style="font-family:'Roboto', Arial, Helvetica, sans-serif;text-decoration: underline;font-size:18px;font-weight: 700;">${content}</a>`
      }
      return match // Если цвет не подходит, оставляем как есть
    })


    // Регулярное выражение для поиска <strong> с атрибутом style, в котором есть цвет
    html = html.replace(/<strong[^>]*style=["'][^"']*(color:\s*rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))[^"']*["'][^>]*>(.*?)<\/strong>/g, function (match, styleAttr, content) {
      // Проверяем, если цвет находится в списке допустимых цветов
      if (colorRegex.test(styleAttr)) {
        // Сохраняем <em> внутри <strong>, если есть
        content = content.replace(/<em[^>]*>(.*?)<\/em>/g, '<em>$1</em>')

        // Возвращаем ссылку вместо <strong>
        return `<a href="urlhere" style="font-family:'Roboto', Arial, Helvetica, sans-serif;text-decoration: underline;font-size:18px;font-weight: 700;">${content}</a>`
      }
      return match // Если цвет не подходит, оставляем как есть
    })


    // Обрабатываем <em> с допустимым цветом и заменяем его на ссылку <a>
    html = html.replace(/<em[^>]*style=["'][^"']*(color:\s*[^"';]+)[^"']*["'][^>]*>(.*?)<\/em>/g, function (match, styleAttr, content) {
      // Проверяем, если цвет находится в списке допустимых цветов
      if (colorRegex.test(styleAttr)) {
        // Возвращаем <a> с сохранением <em>
        return `<a href="urlhere" style="font-family:'Roboto', Arial, Helvetica, sans-serif;text-decoration: underline;font-size:18px;font-weight: 700;"><em>${content}</em></a>`
      }
      return match // Если цвет не подходит, оставляем как есть
    })

    // Проверяем и заменяем пустые теги <em>, <strong>, <b>, <i>, <u> на пробел
    html = html.replace(/<(em|strong|b|i|u)[^>]*>\s*<\/\1>/g, ' ')

    // Убираем <br><br> перед картинкой и после текста перед картинкой
    html = html.replace(/(<br\s*\/?>\s*){2,}(?=<img[^>]*>)/gi, '')

    // Убираем <br><br> после текста, если после него идет картинка
    html = html.replace(/(<img[^>]*>)\s*(<br\s*\/?>\s*){2,}/gi, '$1')

    // Удаляем теги <span>, если цвет текста черный (rgb(15, 15, 15)), сохраняя содержимое
    html = html.replace(/<span[^>]*style=["'][^"']*color:\s*rgb\(15,\s*15,\s*15\)[^"']*["'][^>]*>(.*?)<\/span>/g, '$1')


    // Удаляем <span> теги с цветами, которых нет в списке
    html = html.replace(/<span[^>]*style=["'][^"']*color:\s*([^"';]+)[^"']*["'][^>]*>(.*?)<\/span>/g, function (match, color, content) {
      if (allowedColors.includes(color.trim())) {
        return match // Оставляем, если цвет в списке
      }
      return content // Убираем <span>, если цвет не в списке
    })

    // Проверяем на пустые ссылки <a> и заменяем их на пробел
    html = html.replace(/<a[^>]*>(\s*|\&nbsp;)*<\/a>/g, ' ')

    // Удаляем любой <br>, который стоит сразу после закрывающего тега </ul>
    html = html.replace(/<\/ul>\s*<br>/g, '</ul>')

    // Удаляем все лишние <br> или пробелы после списка перед текстом
    html = html.replace(/<\/ul>\s*(<br\s*\/?>|\s)+([^\s<])/g, '</ul>$2')

    // Удаляем все <br>, оставляем только один перед списком <ul>
    html = html.replace(/(<br\s*\/?>\s*){2,}(<ul[^>]*>)/g, '<br>$2')

    // Удаляем дубликаты <br>
    html = html.replace(/(<br\s*\/?>\s*){3,}/g, '<br><br>')

    // Удаление тегов <strong>, <em> и других, если внутри только пробелы или &nbsp;
    html = html.replace(/<(strong|em|b|i|u)[^>]*>\s*(?:&nbsp;|\s)*\s*<\/\1>/gi, ' ')

    // Проверяем и заменяем пустые теги <strong>, <em> на пробел
    html = html.replace(/<(strong|em)[^>]*>\s*<\/\1>/gi, ' ')


    // Удаление комбинаций <br><br>&nbsp;<br><br> и замена их на <br><br>
    html = html.replace(/<br><br>\s*&nbsp;\s*<br><br>/g, '<br><br>')

    // Удаление пробелов или пустых значений между <br><br>
    html = html.replace(/(<br><br>\s*)+/g, '<br><br>')

    // Удаляем все варианты с пробелами или &nbsp; между <br><br>
    html = html.replace(/<br><br>\s*(?:&nbsp;|\s)+\s*<br><br>/g, '<br><br>')

    // Убираем <br> с конца
    html = html.replace(/(<br><br>\s*)+$/g, '')

    return html  // Возвращаем обработанный HTML-код
  }

  // Функция для финальной проверки и удаления лишних <br><br>
  function finalCleanup(html) {
    // Убираем <br><br> перед началом строки <tr>, если это не внутри тегов, таких как <a> или <span>
    html = html.replace(/(<br\s*\/?>\s*){2,}(?=\s*<tr>\s*<td[^>]*>\s*<span[^>]*>)/gi, '')

    // Убираем <br><br> перед началом любой строки <tr>
    html = html.replace(/(<br\s*\/?>\s*){2,}(?=\s*<tr>)/gi, '')

    // Убираем <br><br> перед картинкой и ссылкой
    html = html.replace(/(<br\s*\/?>\s*){2,}(?=\s*<a href="[^"]+"[^>]*>\s*<img[^>]*>)/gi, '')

    // Убираем <br><br> после картинки, если они идут после <img>
    html = html.replace(/(<img[^>]*>\s*)(<br\s*\/?>\s*){2,}/gi, '$1')

    // Убираем <br><br> перед ссылкой внутри <span>
    html = html.replace(/(<br\s*\/?>\s*){2,}(?=\s*<span[^>]*>\s*<a href="[^"]+"[^>]*>)/gi, '')

    // Убираем лишние <br><br> перед закрывающим тегом </span></td></tr>
    html = html.replace(/(<br\s*\/?>\s*){2,}(?=\s*<\/span>\s*<\/td>\s*<\/tr>)/gi, '')

    // Убираем <br><br>, если они идут перед текстом внутри <td><span>
    html = html.replace(/(<br\s*\/?>\s*){2,}(?=\s*<span[^>]*>)/gi, '')

    return html
  }








  // Функция для оборачивания контента в структуру HTML без картинки
  function wrapInTableStructure(content) {
    return `
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 100%;">
        <tr>
          <td align="center" valign="top">
            <table bgcolor="#FFFFFF" border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px">
              <tr>
                <td align="center" style="padding-left: 20px; padding-right: 20px;">
                  <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%;">
                    <tr>
                      <td height="30" width="100%" style="max-width: 100%">
                      </td>
                    </tr>
                    <tr>
                      <td style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                        <span style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                          ${content}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td height="30" width="100%" style="max-width: 100%">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
  }

  // Функция для оборачивания контента в структуру HTML с картинкой
  function wrapWithImageStructure(content) {
    const parts = content.split(/<img[^>]*>/)
    let beforeImage = parts[0]
    let afterImage = parts[1] ? parts[1] : ''
    const { imageUrl, imageWidth, imageAlt } = getImageSettings()

    if (!afterImage.trim()) {
      return `
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 100%;">
          <tr>
            <td align="center" valign="top">
              <table bgcolor="#FFFFFF" border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px">
                <tr>
                  <td align="center" style="padding-left: 20px; padding-right: 20px;">
                    <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%;">
                      <tr>
                        <td height="30" width="100%" style="max-width: 100%">
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                          <span style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                            ${beforeImage}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 20px;">
                          <a href="${imageUrl}" target="_blank">
                           <img alt="${imageAlt}" height="auto" src="${imageUrl}/preview" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;max-width: ${imageWidth}px;font-size:13px;" width="${imageWidth}" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td height="30" width="100%" style="max-width: 100%">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`
    }

    return `
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 100%;">
        <tr>
          <td align="center" valign="top">
            <table bgcolor="#FFFFFF" border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px">
              <tr>
                <td align="center" style="padding-left: 20px; padding-right: 20px;">
                  <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%;">
                    <tr>
                      <td height="30" width="100%" style="max-width: 100%">
                      </td>
                    </tr>
                    <tr>
                      <td style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                        <span style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                          ${beforeImage}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 20px;padding-bottom: 20px;">
                        <a href="${imageUrl}" target="_blank">
                          <img alt="${imageAlt}" height="auto" src="${imageUrl}/preview" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;max-width: ${imageWidth}px;font-size:13px;" width="${imageWidth}" />
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                        <span style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                          ${afterImage}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td height="30" width="100%" style="max-width: 100%">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
  }

  // Функция для оборачивания контента в структуру MJML без картинки
  function wrapInTableStructureMJML(content) {
    return `
      <mjml>
        <mj-head>
          <mj-preview><!-- TODO Add mail preview --></mj-preview>
        </mj-head>
        <mj-body background-color="#FFFFFF">
          <mj-section>
            <mj-column>
              <mj-text font-family="'Roboto',Arial,Helvetica,sans-serif" font-style="normal" font-weight="normal" font-size="18px" line-height="1.5" align="left">
                ${content}
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>`
  }

  // Функция для оборачивания контента в структуру MJML с картинкой
  function wrapWithImageStructureMJML(content) {
    const parts = content.split(/<img[^>]*>/)
    let beforeImage = parts[0]
    let afterImage = parts[1] ? parts[1] : ''
    const { imageUrl, imageWidth, imageAlt } = getImageSettings()

    if (!afterImage.trim()) {
      return `
        <mjml>
          <mj-head>
            <mj-preview><!-- TODO Add mail preview --></mj-preview>
          </mj-head>
          <mj-body background-color="#FFFFFF">
            <mj-section>
              <mj-column>
                <mj-text font-family="'Roboto',Arial,Helvetica,sans-serif" font-style="normal" font-weight="normal" font-size="18px" line-height="1.5" align="left">
                  ${beforeImage}
                </mj-text>
                <mj-image href="urlhere" alt="${imageAlt}" height="auto" src="${imageUrl}/preview" width="${imageWidth}px" align="center"></mj-image>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>`
    }

    return `
      <mjml>
        <mj-head>
          <mj-preview><!-- TODO Add mail preview --></mj-preview>
        </mj-head>
        <mj-body background-color="#FFFFFF">
          <mj-section>
            <mj-column>
              <mj-text font-family="'Roboto',Arial,Helvetica,sans-serif" font-style="normal" font-weight="normal" font-size="18px" line-height="1.5" align="left">
                ${beforeImage}
              </mj-text>
              <mj-image href="urlhere" alt="${imageAlt}" height="auto" src="${imageUrl}/preview" width="${imageWidth}px" align="center"></mj-image>
              <mj-text font-family="'Roboto',Arial,Helvetica,sans-serif" font-style="normal" font-weight="normal" font-size="18px" line-height="1.5" align="left">
                ${afterImage}
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>`
  }

  // Функция для копирования текста в буфер обмена
  document.getElementById('copy-btn').addEventListener('click', function () {
    var contentToCopy = ''
    if (currentView === 'html') {
      contentToCopy = outputContainer.textContent // Копируем HTML-код
    } else if (currentView === 'preview' || currentView === 'mjml') {
      contentToCopy = outputContainer.textContent // Копируем Preview-код или MJML
    }
    copyToClipboard(contentToCopy)
  })

  // Основная функция копирования
  function copyToClipboard(text) {
    var textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
})
